import { Controller, Get, Post, Patch, Param, Body, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { UpdateCartSchema } from '@margen/contracts';
import { SessionGuard } from '../identity/session.guard';
import { CartService } from './cart.service';

@Controller('v1/cart')
@UseGuards(SessionGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  async create(@Req() req: any, @Body() body: unknown) {
    const parsed = UpdateCartSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Invalid cart data', details: parsed.error.issues });
    }
    return this.cartService.createCart(req.userId, parsed.data);
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: unknown) {
    const parsed = UpdateCartSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Invalid cart data', details: parsed.error.issues });
    }
    return this.cartService.updateCart(req.userId, id, parsed.data);
  }

  @Get()
  async ownCart(@Req() req: any) {
    return this.cartService.getUserCart(req.userId);
  }

  @Get('quote')
  async quote(@Req() req: any, @Query('cartId') cartId: string) {
    if (!cartId) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'cartId query parameter is required' });
    }
    return this.cartService.quoteCart(req.userId, cartId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const cart = await this.cartService.getCart(req.userId, id);
    if (!cart) {
      throw new BadRequestException({ code: 'CART_NOT_FOUND', message: 'Cart not found' });
    }
    return cart;
  }
}