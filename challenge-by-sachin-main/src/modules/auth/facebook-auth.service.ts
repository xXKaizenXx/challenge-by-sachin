import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import axios from 'axios';

import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';

import * as config from 'config';
import { SocialAuthRegisterDto } from './dtos/social-auth.dto';
import { FindOneOptions, FindOptionsWhere } from 'typeorm';
import e from 'express';

const facebookConfig = config.get('facebook');

@Injectable()
export class FacebookAuthService {
  logger = new Logger('FacebookAuthService');
  constructor(private readonly userService: UserService) {}

  login(req) {
    if (!req.user) {
      return 'No user from facebook';
    }

    return {
      message: 'User information from facebook',
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

      const options: FindOptionsWhere<UserEntity> = {};
      const email = userData.email ?? null;
      const phone = userData.phone ?? null;

      //TODO find better way of handling this
      if (email && phone) {
        options.email = email;
      } else if (email) {
        options.email = email;
      } else if (phone) {
        options.phone = phone;
      }

      const user = await this.userService.findOne(options);

      if (!user) {
        const newUser: SocialAuthRegisterDto = {
          firstName: userData.first_name,
          lastName: userData.last_name,
          email: userData.email,
          isRegisteredWithFacebook: true,
          avatar: userData?.picture?.data?.url,
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
   * @description This method is used to get the user data from facebook
   */
  async getUserData(token: string) {
    const { data: userData } = await axios.get(
      `https://graph.facebook.com/me?fields=id,first_name,last_name,name,email,picture&access_token=${token}`,
    );

    if (!userData) {
      throw new Error('Invalid access token');
    }
    return userData;
  }
}
