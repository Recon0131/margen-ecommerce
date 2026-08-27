import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SessionGuard } from '../identity/session.guard';
import { RbacGuard } from '../identity/rbac.guard';
import { Roles } from '../identity/roles.decorator';

@Controller('v1/admin')
@UseGuards(SessionGuard, RbacGuard)
export class AdminUsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('users')
  @Roles('admin')
  async listUsers() {
    const users = await this.prisma.user.findMany({
      select: { id: true, email: true, createdAt: true },
    });
    return users;
  }
}
