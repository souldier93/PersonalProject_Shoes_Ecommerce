// auth.controller.ts
import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request, Query } from '@nestjs/common';
import { UsersService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ Public routes
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.usersService.login(loginDto);
  }

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  // ✅ NEW: Verify email endpoint
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.usersService.verifyEmail(token);
  }

  // ✅ NEW: Resend verification email
  @Post('resend-verification')
  resendVerification(@Body('email') email: string) {
    return this.usersService.resendVerificationEmail(email);
  }

  // ✅ Public endpoint to get all registered users
  @Get('users/all')
  getAllUsers() {
    return this.usersService.findAll();
  }

  // ✅ Get current user profile (Protected)
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  // ✅ Admin only routes
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('users')
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('users/:id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('users/:id/role')
  updateRole(@Param('id') id: string, @Body('roleName') roleName: string) {
    return this.usersService.updateUserRole(id, roleName);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('roles/all')
  getRoles() {
    return this.usersService.getAllRoles();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('roles')
  createRole(@Body() roleData: CreateRoleDto) {
    return this.usersService.createRole(roleData);
  }
}