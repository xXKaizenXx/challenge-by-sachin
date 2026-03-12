import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiOkResponse,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { UserDto, UserResponseDto } from '../user/dtos/user.dto';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { LoginPayloadDto, LoginResponseDto } from './dtos/login-payload.dto';
import { TokenVerificationDto } from './dtos/token-verification.dto';
import { UserLoginDto } from './dtos/user-login.dto';
import { UserRegisterDto } from './dtos/user-register.dto';
import { FacebookAuthService } from './facebook-auth.service';
import { GoogleAuthService } from './google-auth.service';

import { Auth } from 'src/decorators/http.decorators';
import { RoleType } from 'src/constants';
import { AdminResetPasswordDto } from './dtos/admin-reset-password.dto';
import { RequestPasswordResetDto } from './dtos/request-password-reset.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
// import { generateHash } from '../../common/utils';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly googleAuthenticationService: GoogleAuthService,
    private readonly facebookAuthenticationService: FacebookAuthService,
  ) { }

  // @Post('/register')
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({ type: UserDto, description: 'Successfully Registered' })
  // async createUser(@Body() userRegisterDto: UserRegisterDto) {
  //   const user = await this.userService.createUser(userRegisterDto);
  //   const token = await this.authService.createAccessToken(user);

  //   const userDto = new UserDto(user);
  //   const registeredUser = UserResponseDto.from({
  //     userDto,
  //     token,
  //   });
  //   registeredUser.message = 'User Registered Successfully';

  //   return registeredUser;
  // }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'User info with access token.' })
  async userLogin(
    @Body() userLoginDto: UserLoginDto,
  ): Promise<LoginResponseDto> {
    const userEntity = await this.authService.validateUser(userLoginDto);
    const token = await this.authService.createAccessToken(userEntity);

    const user = new UserDto(userEntity);
    const loginResponseDto = LoginResponseDto.from({
      user: user,
      token,
    });
    loginResponseDto.message = 'Login Successful';
    return loginResponseDto;
  }

  @Post('/admin-reset-password')
  @Auth([RoleType.SUPER_USER, RoleType.IT])
  @ApiOperation({ summary: 'Super admin or IT resets any user password' })
  @ApiResponse({ status: 200, description: 'Password reset successful.' })
  @ApiResponse({ status: 400, description: 'Validation or logic error.' })
  async adminResetPassword(@Body() dto: AdminResetPasswordDto) {
    const { email, newPassword, confirmPassword } = dto;
    return this.authService.resetUserPassword(email, newPassword, confirmPassword);
  }


  @Post('/request-password-reset')
  @ApiOperation({ summary: 'Request password reset via email' })
  @ApiResponse({ status: 200, description: 'Reset email sent.' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('/reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ status: 200, description: 'Password reset successful.' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPasswordWithToken(dto.token, dto.newPassword, dto.confirmPassword);
  }

  @Get('/google')
  @UseGuards(AuthGuard('google'))
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async googleAuth(@Req() req) { }

  @Get('/google/redirect')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req) {
    return this.googleAuthenticationService.login(req);
  }
  @Post('/google-auth')
  async googleAuthenticate(@Body() tokenData: TokenVerificationDto) {
    const userEntity = await this.googleAuthenticationService.authenticate(
      tokenData.token,
    );

    const user = new UserDto(userEntity);

    const accessToken = await this.authService.createAccessToken(userEntity);
    const loginResponseDto = LoginResponseDto.from({
      user: user,
      accessToken,
    });
    loginResponseDto.message = 'Login Successful';

    return loginResponseDto;
  }

  @Get('/facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookLogin(): Promise<any> {
    return HttpStatus.OK;
  }

  @Get('/facebook/redirect')
  @UseGuards(AuthGuard('facebook'))
  async facebookLoginRedirect(@Req() req: Request): Promise<any> {
    return this.facebookAuthenticationService.login(req);
  }
  @Post('/facebook-auth')
  async facebookAuthenticate(@Body() tokenData: TokenVerificationDto) {
    const userEntity = await this.facebookAuthenticationService.authenticate(
      tokenData.token,
    );

    const user = new UserDto(userEntity);

    const accessToken = await this.authService.createAccessToken(userEntity);
    const loginResponseDto = LoginResponseDto.from({
      user: user,
      accessToken,
    });

    loginResponseDto.message = 'Login Successful';
    return loginResponseDto;
  }
}
