import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthUser } from '@hospital/shared';
import { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { RequestUser } from './jwt.strategy';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Get('me')
  me(@Req() req: Request & { user: RequestUser }): Promise<AuthUser> {
    return this.authService.getProfile(req.user.id);
  }
}
