import { mapDummyJsonProduct, validateUpstreamUrl } from '../dummyjson.mapper';

const validFixture = {
  id: 1,
  title: 'USB-C Hub 7-en-1',
  slug: 'usb-c-hub-7-in-1',
  price: 29.99,
  description: 'Hub con HDMI, USB-A y Power Delivery.',
  category: 'laptops',
  stock: 50,
  images: ['https://cdn.dummyjson.com/products/images/laptops/usb-c-hub.png'],
  thumbnail: 'https://cdn.dummyjson.com/products/images/laptops/usb-c-hub.png',
};

describe('mapDummyJsonProduct', () => {
  it('maps a valid upstream product to an internal PEN product', () => {
    const product = mapDummyJsonProduct(validFixture);
    expect(product.currency).toBe('PEN');
    expect(product.sku).toMatch(/^[A-Z0-9-]{4,32}$/);
    expect(product.name).toBe('USB-C Hub 7-en-1');
    expect(product.priceMinor).toBeGreaterThan(0n);
  });

  it('rejects a product without required fields', () => {
    expect(() => mapDummyJsonProduct({})).toThrow();
    expect(() => mapDummyJsonProduct({ id: 1 })).toThrow();
  });

  it('rejects negative prices', () => {
    expect(() => mapDummyJsonProduct({ ...validFixture, price: -10 })).toThrow();
  });

  it('generates a stable SKU from the upstream id', () => {
    const a = mapDummyJsonProduct(validFixture);
    const b = mapDummyJsonProduct(validFixture);
    expect(a.sku).toBe(b.sku);
  });
});

describe('validateUpstreamUrl', () => {
  it('allows the dummyjson.com host', () => {
    expect(() => validateUpstreamUrl('https://dummyjson.com/products')).not.toThrow();
  });

  it('rejects non-HTTPS URLs', () => {
    expect(() => validateUpstreamUrl('http://dummyjson.com/products')).toThrow('UPSTREAM_NOT_ALLOWED');
  });

  it('rejects hosts outside the allowlist', () => {
    expect(() => validateUpstreamUrl('https://evil.com/products')).toThrow('UPSTREAM_NOT_ALLOWED');
  });

  it('rejects localhost and private IPs', () => {
    expect(() => validateUpstreamUrl('https://127.0.0.1:8080/internal')).toThrow('UPSTREAM_NOT_ALLOWED');
    expect(() => validateUpstreamUrl('https://localhost:3000/api')).toThrow('UPSTREAM_NOT_ALLOWED');
  });
});
