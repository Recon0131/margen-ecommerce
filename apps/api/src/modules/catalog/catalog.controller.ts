import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { ProductQuerySchema } from '@margen/contracts';
import { CatalogService } from './catalog.service';

@Controller('v1/catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('products')
  async listProducts(@Query() query: Record<string, unknown>) {
    const parsed = ProductQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: parsed.error.issues });
    }
    const { page, limit, category, query: search } = parsed.data;
    return this.catalog.list({ page, limit, category, query: search });
  }

  @Get('products/:slug')
  async getProduct(@Param('slug') slug: string) {
    const product = await this.catalog.findBySlug(slug);
    if (!product) {
      throw new BadRequestException({ code: 'NOT_FOUND', message: 'Product not found' });
    }
    return product;
  }

  @Get('categories')
  async listCategories() {
    return this.catalog.listCategories();
  }
}
