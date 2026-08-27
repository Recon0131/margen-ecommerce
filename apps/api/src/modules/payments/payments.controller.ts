import { Controller, Get, Post, Param, Body, Headers, HttpCode } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  async createCheckout(@Body() body: { orderId: string }) {
    return this.paymentsService.createCheckout(body.orderId);
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Body() body: { type: string; data: { id: string } },
    @Headers('x-signature') signature?: string,
  ) {
    await this.paymentsService.handleWebhook(body, signature);
    return { ok: true };
  }

  @Get(':orderId')
  async getPaymentStatus(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentStatus(orderId);
  }
}
