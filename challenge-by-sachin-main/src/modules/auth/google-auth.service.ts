import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';

import { google, Auth } from 'googleapis';
import * as config from 'config';
import { SocialAuthRegisterDto } from './dtos/social-auth.dto';

const googleConfig = config.get('google');

@Injectable()
export class GoogleAuthService {
  oauthClient: Auth.OAuth2Client;
  logger = new Logger('GoogleAuthService');
  constructor(private readonly userService: UserService) {
    this.oauthClient = new google.auth.OAuth2(
      googleConfig.client_id,
      googleConfig.client_secret,
    );
  }

  login(req) {
    if (!req.user) {
      return 'No user from google';
    }
    return {
      message: 'User information from google',
      user: req.user,
    };
  }

  /**
   * @param  {string} token
   * @returns Promise
   * @description This method is used to authenticate the user on google
   */
  async authenticate(token: string): Promise<UserEntity> {
    try {
      const userData = await this.getUserData(token);

      if (!userData || !userData.email) {
        throw new BadRequestException('Invalid token');
      }

      const email = userData.email;

      const user = await this.userService.findOne({
        email,
      });

      if (!user) {
        const newUser: SocialAuthRegisterDto = {
          firstName: userData.given_name,
          lastName: userData.family_name,
          email: userData.email,
          isRegisteredWithGoogle: true,
          avatar: userData.picture,
        };
        const createdUserEntity = await this.userService.createSociallAuthUser(
          newUser,
        );

        return createdUserEntity;
      }

      return user;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Invalid token');
    }
  }
  /**
   * @param  {string} token
   * @returns Promise
   * @description This method is used to get the user data from google
   */
  async getUserData(token: string) {
    const userInfoClient = google.oauth2('v2').userinfo;

    this.oauthClient.setCredentials({
      access_token: token,
    });

    const userInfoResponse = await userInfoClient.get({
      auth: this.oauthClient,
    });

    return userInfoResponse.data;
  }
}
