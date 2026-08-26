import { CatalogService } from '../catalog.service';

function createMockRepository() {
  return {
    list: jest.fn(),
    findBySlug: jest.fn(),
    listCategories: jest.fn(),
  };
}

function createMockUpstream() {
  return {
    fetchProducts: jest.fn(),
  };
}

describe('CatalogService', () => {
  let service: CatalogService;
  let repo: ReturnType<typeof createMockRepository>;
  let upstream: ReturnType<typeof createMockUpstream>;

  beforeEach(() => {
    repo = createMockRepository();
    upstream = createMockUpstream();
    service = new CatalogService(repo as any, upstream as any);
  });

  it('returns database results when upstream is available', async () => {
    repo.list.mockResolvedValue({ items: [], total: 0, page: 1, limit: 10, source: 'database' });
    const result = await service.list({ page: 1, limit: 10 });
    expect(result.source).toBe('database');
    expect(repo.list).toHaveBeenCalled();
  });

  it('serves the last valid catalog when upstream is unavailable', async () => {
    repo.list.mockResolvedValue({ items: [{ slug: 'hub' }], total: 1, page: 1, limit: 10, source: 'database' });
    upstream.fetchProducts.mockRejectedValue(new Error('timeout'));
    const result = await service.list({ page: 1, limit: 10 });
    expect(result.source).toBe('database');
  });

  it('returns null for a non-existent slug', async () => {
    repo.findBySlug.mockResolvedValue(null);
    await expect(service.findBySlug('nonexistent')).resolves.toBeNull();
  });
});
