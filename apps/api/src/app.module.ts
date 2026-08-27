import { Controller, Get, Module } from '@nestjs/common';
import { PrismaModule } from './database/prisma.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CartModule } from './modules/cart/cart.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrdersModule } from './modules/orders/orders.module';
import { IdentityModule } from './modules/identity/identity.module';
import { AdminUsersModule } from './modules/admin/admin-users.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Controller()
class HealthController {
  @Get('health')
  health(): { status: 'ok'; version: string } {
    return { status: 'ok', version: process.env.APP_VERSION ?? '0.1.0' };
  }
}

@Module({
  imports: [PrismaModule, CatalogModule, CartModule, InventoryModule, OrdersModule, IdentityModule, AdminUsersModule, PaymentsModule],
  controllers: [HealthController],
})
export class AppModule {}
