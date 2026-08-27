import { Controller, Get, Post, Patch, Param, Body, Query, BadRequestException } from '@nestjs/common';
import { UpdateCartSchema } from '@margen/contracts';
import { CartService } from './cart.service';

@Controller('v1/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  async create(@Body() body: unknown) {
    const parsed = UpdateCartSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Invalid cart data', details: parsed.error.issues });
    }
    return this.cartService.createCart(parsed.data);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const parsed = UpdateCartSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Invalid cart data', details: parsed.error.issues });
    }
    return this.cartService.updateCart(id, parsed.data);
  }

  @Get('quote')
  async quote(@Query('cartId') cartId: string) {
    if (!cartId) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'cartId query parameter is required' });
    }
    return this.cartService.quoteCart(cartId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const cart = await this.cartService.getCart(id);
    if (!cart) {
      throw new BadRequestException({ code: 'CART_NOT_FOUND', message: 'Cart not found' });
    }
    return cart;
  }
}
