import { Injectable, Logger } from '@nestjs/common';
import { CatalogRepository } from './catalog.repository';
import { DummyJsonClient } from './dummyjson.client';
import { Page, ProductSummary, ProductDetail, CategorySummary } from './catalog.schemas';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    private readonly repository: CatalogRepository,
    private readonly upstream: DummyJsonClient,
  ) {}

  async list(params: { page: number; limit: number; category?: string; query?: string }): Promise<Page<ProductSummary>> {
    return this.repository.list(params);
  }

  async findBySlug(slug: string): Promise<ProductDetail | null> {
    return this.repository.findBySlug(slug);
  }

  async listCategories(): Promise<CategorySummary[]> {
    return this.repository.listCategories();
  }
}
