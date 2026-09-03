import { Controller, Get, Post, Param, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { CreateOrderSchema } from '@margen/contracts';
import { SessionGuard } from '../identity/session.guard';
import { SessionService } from '../identity/session.service';
import { OrdersService } from './orders.service';

@Controller('v1/orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly sessionService: SessionService,
  ) {}

  @Get()
  @UseGuards(SessionGuard)
  async listOrders(@Req() req: any) {
    return this.ordersService.listOrders(req.userId);
  }

  @Post()
  async createOrder(@Body() body: unknown, @Req() req: any) {
    const parsed = CreateOrderSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Invalid order data', details: parsed.error.issues });
    }
    const userId = await this.resolveUserId(req);
    return this.ordersService.createOrder(parsed.data, userId);
  }

  @Get(':id')
  @UseGuards(SessionGuard)
  async getOrder(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.getOrder(req.userId, id);
  }

  private async resolveUserId(req: any): Promise<string | undefined> {
    if (req?.userId) return req.userId;
    const token = this.sessionService.extractTokenFromCookie(req?.headers?.cookie);
    if (!token) return undefined;
    const session = await this.sessionService.validate(token);
    return session?.userId ?? undefined;
  }
}
