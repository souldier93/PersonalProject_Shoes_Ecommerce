// auth.service.ts
import { 
  Injectable, 
  OnModuleInit, 
  NotFoundException, 
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { Role, RoleDocument } from './role.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from './email.service'; // ✅ Import EmailService

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    private jwtService: JwtService,
    private emailService: EmailService, // ✅ Inject EmailService
  ) {}

  async onModuleInit() {
    await this.seedRoles();
  }

  private async seedRoles() {
    const existingRoles = await this.roleModel.countDocuments();
    if (existingRoles === 0) {
      await this.roleModel.insertMany([
        {
          name: 'admin',
          description: 'Administrator with full access',
          permissions: ['*'],
          active: true,
        },
        {
          name: 'user',
          description: 'Regular user',
          permissions: ['read:products', 'create:orders'],
          active: true,
        },
        {
          name: 'manager',
          description: 'Manager with limited admin access',
          permissions: ['read:*', 'write:products', 'write:orders'],
          active: true,
        },
      ]);
      console.log('✅ Roles seeded successfully');
    }
  }

  async findAll() {
    return this.userModel
      .find()
      .populate('roleId', 'name description permissions')
      .select('-password -verificationToken')
      .lean()
      .exec();
  }

  async findById(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate('roleId')
      .select('-password -verificationToken')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return user;
  }

  async createUser(createUserDto: CreateUserDto) {
    // ✅ Check username exists
    const existingUser = await this.userModel.findOne({
      username: createUserDto.username,
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // ✅ Check email exists
    const existingEmail = await this.userModel.findOne({
      email: createUserDto.email,
    });

    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // ✅ Find role
    const role = await this.roleModel.findOne({ name: createUserDto.roleName });
    if (!role) {
      throw new NotFoundException(`Role "${createUserDto.roleName}" not found`);
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // ✅ Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = new this.userModel({
      username: createUserDto.username,
      password: hashedPassword,
      email: createUserDto.email,
      roleId: role._id,
      age: createUserDto.age,
      active: true,
      isVerified: false, // ✅ Chưa xác thực
      verificationToken,
      verificationTokenExpires,
    });

    const savedUser = await user.save();

    // ✅ Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        createUserDto.email,
        verificationToken,
      );
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Không throw error để user vẫn được tạo
    }

    return {
      success: true,
      message: 'User created successfully. Please check your email to verify your account.',
      user: {
        _id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        isVerified: savedUser.isVerified,
      },
    };
  }

  // ✅ NEW: Verify email
  async verifyEmail(token: string) {
    const user = await this.userModel.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }, // Token chưa hết hạn
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // ✅ Sử dụng $unset để xóa các trường
    await this.userModel.findByIdAndUpdate(user._id, {
      $set: { isVerified: true },
      $unset: { verificationToken: '', verificationTokenExpires: '' }
    });

    return {
      success: true,
      message: 'Email verified successfully. You can now login.',
    };
  }

  // ✅ NEW: Resend verification email
  async resendVerificationEmail(email: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    await this.emailService.sendVerificationEmail(email, verificationToken);

    return {
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    };
  }

  async updateUserRole(userId: string, newRoleName: string) {
    const role = await this.roleModel.findOne({ name: newRoleName });
    if (!role) {
      throw new NotFoundException(`Role "${newRoleName}" not found`);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { roleId: role._id }, { new: true })
      .populate('roleId')
      .select('-password -verificationToken');

    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return updatedUser;
  }

  async updateProfile(userId: string, profileData: {
    username?: string;
    email?: string;
    age?: number;
    phone?: string;
    fullName?: string;
  }) {
    const updateData: any = {};
    ['username', 'email', 'age', 'phone', 'fullName'].forEach((key) => {
      if (profileData[key] !== undefined) updateData[key] = profileData[key];
    });

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
      .populate('roleId')
      .select('-password -verificationToken')
      .lean()
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return {
      success: true,
      user: updatedUser,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  async addAddress(userId: string, address: any) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const addresses = user.addresses || [];
    const nextAddress = {
      ...address,
      isDefault: address.isDefault || addresses.length === 0,
    };

    if (nextAddress.isDefault) {
      addresses.forEach((item: any) => item.isDefault = false);
    }

    user.addresses = [...addresses, nextAddress];
    await user.save();

    return {
      success: true,
      addresses: user.addresses,
    };
  }

  async updateAddress(userId: string, index: number, address: any) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const addresses = user.addresses || [];
    if (!addresses[index]) {
      throw new NotFoundException('Address not found');
    }

    if (address.isDefault) {
      addresses.forEach((item: any) => item.isDefault = false);
    }

    addresses[index] = {
      ...addresses[index],
      ...address,
    };

    user.addresses = addresses;
    await user.save();

    return {
      success: true,
      addresses: user.addresses,
    };
  }

  async deleteAddress(userId: string, index: number) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const addresses = user.addresses || [];
    if (!addresses[index]) {
      throw new NotFoundException('Address not found');
    }

    addresses.splice(index, 1);
    if (addresses.length && !addresses.some((item: any) => item.isDefault)) {
      addresses[0].isDefault = true;
    }

    user.addresses = addresses;
    await user.save();

    return {
      success: true,
      addresses: user.addresses,
    };
  }

  async getAllRoles() {
    return this.roleModel.find().lean().exec();
  }

  async createRole(roleData: CreateRoleDto) {
    const existingRole = await this.roleModel.findOne({ name: roleData.name });
    if (existingRole) {
      throw new ConflictException(`Role "${roleData.name}" already exists`);
    }

    const role = new this.roleModel(roleData);
    return role.save();
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // Validate user
    const user = await this.validateUser(username, password);

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // ✅ Check if email is verified
    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    // ✅ Generate JWT token
    const payload = { 
      sub: user._id, 
      username: user.username,
      role: (user.roleId as any).name 
    };
    
    const accessToken = this.jwtService.sign(payload);

    // Return user with token
    return {
      success: true,
      accessToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: (user.roleId as any).name,
        roleId: user.roleId,
        age: user.age,
        active: user.active,
        isVerified: user.isVerified,
      },
      message: 'Login successful',
    };
  }

  async validateUser(username: string, password: string) {
    const login = username.trim();
    const user = await this.userModel.findOne({
      $or: [{ username: login }, { email: login }],
    }).populate('roleId');

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const { password: _, verificationToken: __, ...result } = user.toObject();
    return result;
  }
}
