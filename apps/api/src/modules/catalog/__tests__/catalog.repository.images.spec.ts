import { toProductImages } from '../catalog.repository';

describe('toProductImages', () => {
  it('returns an empty array for non-array values', () => {
    expect(toProductImages(null)).toEqual([]);
    expect(toProductImages('not-an-array')).toEqual([]);
    expect(toProductImages({})).toEqual([]);
  });

  it('returns an empty array for an empty array', () => {
    expect(toProductImages([])).toEqual([]);
  });

  it('parses valid image objects from a JSON array', () => {
    const value = [
      { url: 'https://cdn.dummyjson.com/products/images/laptops/hub.png', alt: 'USB-C Hub' },
      { url: 'https://cdn.dummyjson.com/products/images/laptops/hub-2.png', alt: 'USB-C Hub' },
    ];
    expect(toProductImages(value)).toEqual(value);
  });

  it('drops malformed entries while keeping valid ones', () => {
    const value = [
      null,
      'bogus',
      { url: 'https://cdn.dummyjson.com/x.png' },
      { alt: 'missing url' },
      { url: 123, alt: 'bad url type' },
    ];
    expect(toProductImages(value)).toEqual([]);
  });

  it('keeps only objects with both string url and alt', () => {
    const value = [
      { url: 'https://cdn.dummyjson.com/a.png', alt: 'A' },
      { url: 'https://cdn.dummyjson.com/b.png' },
      { url: 'https://cdn.dummyjson.com/c.png', alt: 'C', extra: true },
    ];
    const result = toProductImages(value);
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.url)).toEqual([
      'https://cdn.dummyjson.com/a.png',
      'https://cdn.dummyjson.com/c.png',
    ]);
  });
});
