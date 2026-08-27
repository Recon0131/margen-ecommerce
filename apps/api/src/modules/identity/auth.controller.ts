import { Controller, Post, Get, Body, Res, Req, UseGuards, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SessionGuard } from './session.guard';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string }) {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.login(body.email, body.password);
    res.setHeader('Set-Cookie', result.cookie);
    return { userId: result.userId };
  }

  @Post('logout')
  @UseGuards(SessionGuard)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const token = this.extractTokenFromCookie(req.headers?.cookie);
    if (token) {
      await this.authService['sessionService'].destroy(token);
    }
    res.setHeader('Set-Cookie', 'margen_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return { ok: true };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  async me(@Req() req: any) {
    return this.authService.getMe(req.userId);
  }

  private extractTokenFromCookie(cookieHeader: string | undefined): string | null {
    if (!cookieHeader) return null;
    for (const cookie of cookieHeader.split(';')) {
      const [name, ...rest] = cookie.trim().split('=');
      if (name === 'margen_session') {
        return rest.join('=');
      }
    }
    return null;
  }
}
