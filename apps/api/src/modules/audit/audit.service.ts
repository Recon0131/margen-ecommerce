import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(event: {
    actorId?: string;
    action: string;
    resourceType: string;
    resourceId: string;
    outcome: string;
    correlationId: string;
  }): Promise<void> {
    await this.prisma.auditEvent.create({
      data: {
        actorId: event.actorId,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        outcome: event.outcome,
        correlationId: event.correlationId,
      },
    });
  }
}
