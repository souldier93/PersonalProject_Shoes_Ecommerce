import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ username }).exec();
    if (user && user.password === password) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }
}
