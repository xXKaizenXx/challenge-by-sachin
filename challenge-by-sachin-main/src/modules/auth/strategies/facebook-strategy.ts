import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';
import * as config from 'config';

const facebookConfig = config.get('facebook');

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: facebookConfig.app_id,
      clientSecret: facebookConfig.app_secret,
      callbackURL: facebookConfig.callback_url,
      scope: 'email',
      profileFields: ['emails', 'name'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { name, emails } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
    };
    const payload = {
      user,
      accessToken,
    };

    done(null, payload);
  }
}
