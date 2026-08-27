import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionService } from './session.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const cookieHeader = request.headers?.cookie;
    const token = this.sessionService.extractTokenFromCookie(cookieHeader);

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    const session = await this.sessionService.validate(token);
    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    request.userId = session.userId;
    return true;
  }
}
