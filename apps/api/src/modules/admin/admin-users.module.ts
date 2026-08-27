import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { IdentityModule } from '../identity/identity.module';
import { AdminUsersController } from './admin-users.controller';

@Module({
  imports: [PrismaModule, IdentityModule],
  controllers: [AdminUsersController],
})
export class AdminUsersModule {}
