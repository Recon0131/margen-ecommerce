import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
  ) {}

  async register(input: { email: string; password: string }): Promise<{ id: string; email: string }> {
    const validation = this.passwordService.validate(input.password);
    if (!validation.valid) {
      throw new BadRequestException(validation.reason);
    }

    if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      throw new BadRequestException('Invalid email format');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new BadRequestException('Registration failed');
    }

    const passwordHash = await this.passwordService.hash(input.password);
    const user = await this.prisma.user.create({
      data: { email: input.email, passwordHash },
    });

    return { id: user.id, email: user.email };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ userId: string; cookie: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.passwordService.verify(user.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { cookie } = await this.sessionService.create(user.id);
    return { userId: user.id, cookie };
  }

  async getMe(userId: string): Promise<{ id: string; email: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return { id: user.id, email: user.email };
  }
}
