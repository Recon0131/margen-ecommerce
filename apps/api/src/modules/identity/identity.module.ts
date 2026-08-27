import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { SessionGuard } from './session.guard';
import { RbacGuard } from './rbac.guard';
import { AuditService } from '../audit/audit.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, SessionService, SessionGuard, RbacGuard, AuditService],
  exports: [SessionGuard, RbacGuard, SessionService, AuditService],
})
export class IdentityModule {}
