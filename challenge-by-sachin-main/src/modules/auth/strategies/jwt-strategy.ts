import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as config from 'config';

import { UserEntity } from '../../user/user.entity';
import { UserService } from '../../user/user.service';
import { UserLoginDto } from '../dtos/user-login.dto';

const jwtConfig = config.get('jwt');

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConfig.secret,
    });
  }

  async validate(payload: UserLoginDto): Promise<UserEntity> {
    const user = await this.userService.findOne({ username: payload.username });

    if (!user) {
      throw new UnauthorizedException('Unauthorized access');
    }

    return user;
  }
}
