const { PrismaClient } = require('@prisma/client');
async function main() {
  const p = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres:postgres@127.0.0.1:5432/margen' } } });
  try {
    const products = await p.product.findMany({ take: 2 });
    console.log('Products:', products.length);
    console.log(JSON.stringify(products, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await p.$disconnect();
  }
}
main();
