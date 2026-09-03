import { Controller, Get, Post, Param, Body, Headers, HttpCode, BadRequestException } from '@nestjs/common';
import { CheckoutRequestSchema } from '@margen/contracts';
import { PaymentsService } from './payments.service';

@Controller('v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  async createCheckout(@Body() body: unknown) {
    const parsed = CheckoutRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Invalid checkout data', details: parsed.error.issues });
    }
    return this.paymentsService.createCheckout(parsed.data.orderId);
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
