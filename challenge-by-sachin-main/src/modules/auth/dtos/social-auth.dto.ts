import { UserEntity } from 'src/modules/user/user.entity';

export class SocialAuthDto {
  accessToken: string;
  userEntity: UserEntity;
}

export class SocialAuthRegisterDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  isRegisteredWithGoogle?: boolean;
  isRegisteredWithFacebook?: boolean;
  avatar?: string;
  phone?: string;
}
