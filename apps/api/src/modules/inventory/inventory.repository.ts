import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InventoryItem, InventoryMovement, StockReservation } from '@prisma/client';

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySku(sku: string): Promise<InventoryItem | null> {
    return this.prisma.inventoryItem.findUnique({ where: { sku } });
  }

  async createMovement(data: {
    inventoryItemId: string;
    reason: string;
    previousOnHand: number;
    nextOnHand: number;
    correlationId: string;
  }): Promise<InventoryMovement> {
    return this.prisma.inventoryMovement.create({ data });
  }

  async findActiveReservations(filter: {
    expiresBefore?: Date;
    orderId?: string;
  }): Promise<StockReservation[]> {
    const where: Record<string, unknown> = { status: 'ACTIVE' };
    if (filter.expiresBefore) {
      where.expiresAt = { lt: filter.expiresBefore };
    }
    if (filter.orderId) {
      where.orderId = filter.orderId;
    }
    return this.prisma.stockReservation.findMany({ where });
  }
}
