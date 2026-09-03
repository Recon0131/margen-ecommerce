import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { InventoryRepository } from './inventory.repository';
import { reserveStock } from '@margen/domain';

export type ReservationLine = { sku: string; quantity: number };
export type ReservationResult = {
  status: 'reserved' | 'insufficient_stock';
  details: { sku: string; quantity: number; available?: number }[];
};

type TransactionLike = Pick<Prisma.TransactionClient, 'inventoryItem' | 'stockReservation' | 'inventoryMovement' | '$executeRaw'>;

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: InventoryRepository,
  ) {}

  async reserveStock(params: {
    orderId: string;
    lines: ReservationLine[];
    tx?: TransactionLike;
  }): Promise<ReservationResult> {
    const { orderId, lines, tx } = params;
    const correlationId = crypto.randomUUID();

    const run = (client: TransactionLike) => this.reserveStockInternal(client, orderId, lines, correlationId);

    const result = tx ? await run(tx) : await this.prisma.$transaction(run);

    this.logger.log(`Reservation ${result.status} for order ${orderId} (correlation: ${correlationId})`);
    return result;
  }

  private async reserveStockInternal(
    tx: TransactionLike,
    orderId: string,
    lines: ReservationLine[],
    correlationId: string,
  ): Promise<ReservationResult> {
    const details: { sku: string; quantity: number; available?: number }[] = [];
    let hasInsufficient = false;

    for (const line of lines) {
      const item = await tx.inventoryItem.findUnique({ where: { sku: line.sku } });
      if (!item) {
        hasInsufficient = true;
        details.push({ sku: line.sku, quantity: 0, available: 0 });
        continue;
      }

      const check = reserveStock({
        sku: line.sku,
        requestedQuantity: line.quantity,
        onHand: item.onHand,
        reserved: item.reserved,
      });

      if (!check.ok) {
        hasInsufficient = true;
        details.push({ sku: line.sku, quantity: 0, available: check.available });
        continue;
      }

      const updated = await tx.$executeRaw`
        UPDATE "InventoryItem"
        SET "reserved" = "reserved" + ${line.quantity},
            "version" = "version" + 1
        WHERE "sku" = ${line.sku}
          AND ("onHand" - "reserved") >= ${line.quantity}
      `;

      if (updated === 0) {
        hasInsufficient = true;
        details.push({ sku: line.sku, quantity: 0, available: item.onHand - item.reserved });
        continue;
      }

      await tx.stockReservation.create({
        data: {
          inventoryItemId: item.id,
          orderId,
          quantity: line.quantity,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      await tx.inventoryMovement.create({
        data: {
          inventoryItemId: item.id,
          reason: 'RESERVE',
          previousOnHand: item.onHand,
          nextOnHand: item.onHand,
          correlationId,
        },
      });

      details.push({ sku: line.sku, quantity: line.quantity });
    }

    return {
      status: hasInsufficient ? ('insufficient_stock' as const) : ('reserved' as const),
      details,
    };
  }

  async releaseExpiredReservations(): Promise<number> {
    const expired = await this.repository.findActiveReservations({
      expiresBefore: new Date(),
    });

    if (expired.length === 0) return 0;

    const correlationId = crypto.randomUUID();

    for (const reservation of expired) {
      const item = await this.repository.findBySku(
        (await this.prisma.inventoryItem.findUnique({ where: { id: reservation.inventoryItemId } }))?.sku ?? '',
      );

      if (!item) continue;

      await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
          UPDATE "InventoryItem"
          SET "reserved" = "reserved" - ${reservation.quantity},
              "version" = "version" + 1
          WHERE "id" = ${item.id}
            AND "reserved" >= ${reservation.quantity}
        `;

        await tx.stockReservation.update({
          where: { id: reservation.id },
          data: { status: 'RELEASED' },
        });

        await tx.inventoryMovement.create({
          data: {
            inventoryItemId: item.id,
            reason: 'RELEASE',
            previousOnHand: item.onHand,
            nextOnHand: item.onHand,
            correlationId,
          },
        });
      });
    }

    this.logger.log(`Released ${expired.length} expired reservations (correlation: ${correlationId})`);
    return expired.length;
  }
}
