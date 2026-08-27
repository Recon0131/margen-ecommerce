import { Controller, Get, Post, Param, Body, BadRequestException } from '@nestjs/common';
import { CreateOrderSchema } from '@margen/contracts';
import { OrdersService } from './orders.service';

@Controller('v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async listOrders() {
    return this.ordersService.listOrders();
  }

  @Post()
  async createOrder(@Body() body: unknown) {
    const parsed = CreateOrderSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Invalid order data', details: parsed.error.issues });
    }
    return this.ordersService.createOrder(parsed.data);
  }

  @Get(':id')
  async getOrder(@Param('id') id: string) {
    return this.ordersService.getOrder(id);
  }
}
