import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';
import { sendPasswordResetEmail } from './email/email.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { validateHash, generateHash } from 'src/common/utils'
import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { UserLoginDto } from './dtos/user-login.dto';

import { google, Auth } from 'googleapis';
import * as config from 'config';

const googleConfig = config.get('google');

@Injectable()
export class AuthService {
  oauthClient: Auth.OAuth2Client;
  logger = new Logger('AuthService');
  constructor(
    private readonly userService: UserService,
    @InjectRepository(PasswordResetTokenEntity)
    private readonly passwordResetTokenRepo: Repository<PasswordResetTokenEntity>,
    private jwtService: JwtService,
  ) {
    this.oauthClient = new google.auth.OAuth2(
      googleConfig.client_id,
      googleConfig.client_secret,
    );
  }

   async requestPasswordReset(email: string) {
    const user = await this.userService.findOne({ email });
    if (!user) {
      return { success: false, message: 'User not found.' };
    }
    // Generate a unique 6-digit code
    let token;
    do {
      token = Math.floor(100000 + Math.random() * 900000).toString();
      // Ensure uniqueness by checking for existing token
    } while (await this.passwordResetTokenRepo.findOne({ where: { token } }));
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    const resetToken = this.passwordResetTokenRepo.create({
      token,
      user,
      expiresAt,
    });
    await this.passwordResetTokenRepo.save(resetToken);
    await sendPasswordResetEmail(email, token, user);
    return { success: true, message: 'Password reset email sent.' };
  }

  async resetPasswordWithToken(token: string, newPassword: string, confirmPassword: string) {
    if (newPassword !== confirmPassword) {
      return { success: false, message: 'Passwords do not match.' };
    }
    const resetToken = await this.passwordResetTokenRepo.findOne({ where: { token }, relations: ['user'] });
    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return { success: false, message: 'Invalid or expired token.' };
    }
    const user = resetToken.user;
    user.password = newPassword;
    await this.userService.save(user);
    resetToken.used = true;
    await this.passwordResetTokenRepo.save(resetToken);
    return { success: true, message: 'Password reset successful.' };
  }
  async createAccessToken(user: Partial<UserEntity>): Promise<string> {
    return this.jwtService.signAsync({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  }

  async resetUserPassword(email: string, newPassword: string, confirmPassword: string) {
    if (newPassword !== confirmPassword) {
      return { success: false, message: 'Passwords do not match.' };
    }
    const user = await this.userService.findOne({ email });
    if (!user) {
      return { success: false, message: 'User not found.' };
    }
  user.password = newPassword;
    await this.userService.save(user);
    return { success: true, message: 'Password reset successful.' };
  }

  async validateUser(userLoginDto: UserLoginDto): Promise<UserEntity> {
    const user = await this.userService.findOne({
      username: userLoginDto.username,
    });

    const isPasswordValid = await validateHash(
      userLoginDto.password,
      user?.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user!;
  }

  facebookLogin(req) {
    if (!req.user) {
      return 'No user from facebook';
    }

    return {
      message: 'User information from facebook',
      user: req.user,
    };
  }
}
