import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../database/prisma.service';

const SESSION_COOKIE_NAME = 'margen_session';
const SESSION_MAX_AGE = 86400;
const TOKEN_LENGTH = 32;

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async create(userId: string): Promise<{ token: string; cookie: string }> {
    const token = randomBytes(TOKEN_LENGTH).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

    await this.prisma.session.create({
      data: { userId, tokenHash, expiresAt },
    });

    const cookie = `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`;
    return { token, cookie };
  }

  async validate(token: string): Promise<{ userId: string } | null> {
    const tokenHash = this.hashToken(token);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return { userId: session.userId };
  }

  async destroy(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await this.prisma.session.deleteMany({ where: { tokenHash } });
  }

  extractTokenFromCookie(cookieHeader: string | undefined): string | null {
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const [name, ...rest] = cookie.trim().split('=');
      if (name === SESSION_COOKIE_NAME) {
        return rest.join('=');
      }
    }
    return null;
  }
}
