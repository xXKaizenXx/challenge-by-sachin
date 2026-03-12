import { forwardRef, Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt-strategy';
import * as config from 'config';

import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google-stategy';
import { FacebookStrategy } from './strategies/facebook-strategy';
import { GoogleAuthService } from './google-auth.service';
import { FacebookAuthService } from './facebook-auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';

const jwtConfig = config.get('jwt');

@Module({
  imports: [
    forwardRef(() => UserModule),
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.register({
      secret: jwtConfig.secret,
      // privateKey: jwtConfig.private_key,
      // publicKey: jwtConfig.public_key,
      signOptions: {
        expiresIn: jwtConfig.expiresIn,
        // algorithm: 'RS256',
      },
      // verifyOptions: {
      //   algorithms: ['RS256'],
      // },
    }),
    TypeOrmModule.forFeature([PasswordResetTokenEntity]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleAuthService,
    FacebookAuthService,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
  ],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
