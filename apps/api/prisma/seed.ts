import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type CategorySeed = {
  slug: string;
  name: string;
  products: Array<{
    slug: string;
    sku: string;
    name: string;
    description: string;
    priceMinor: bigint;
    thumbnail: string;
    onHand: number;
  }>;
};

const CATEGORIES: CategorySeed[] = [
  {
    slug: 'accesorios',
    name: 'Accesorios',
    products: [
      {
        slug: 'usb-c-hub-01',
        sku: 'HUB-01',
        name: 'USB-C Hub 7-en-1',
        description:
          'Hub USB-C con HDMI 4K, USB-A 3.0 x3, SD, microSD y Power Delivery 100W. Ideal para laptops y tablets.',
        priceMinor: 10990n,
        thumbnail: 'https://cdn.dummyjson.com/products/images/accessories/apple-watch-series-7/1.png',
        onHand: 50,
      },
      {
        slug: 'teclado-mecanico-60',
        sku: 'TEC-60',
        name: 'Teclado Mecánico 60% RGB',
        description:
          'Teclado mecánico compacto con switches red, retroiluminación RGB y conexión inalámbrica Bluetooth 5.1.',
        priceMinor: 24990n,
        thumbnail: 'https://cdn.dummyjson.com/products/images/accessories/apple-watch-series-7/1.png',
        onHand: 35,
      },
      {
        slug: 'mouse-inalambrico-pro',
        sku: 'MOU-PRO',
        name: 'Mouse Inalámbrico Pro',
        description:
          'Mouse ergonómico inalámbrico con sensor de 16000 DPI, 7 botones programables y batería de larga duración.',
        priceMinor: 15990n,
        thumbnail: 'https://cdn.dummyjson.com/products/images/accessories/apple-watch-series-7/1.png',
        onHand: 80,
      },
      {
        slug: 'soporte-laptop-aluminio',
        sku: 'SOP-LAP',
        name: 'Soporte para Laptop de Aluminio',
        description:
          'Soporte plegable de aluminio con altura ajustable y disipación de calor para laptops de 10" a 17".',
        priceMinor: 8990n,
        thumbnail: 'https://cdn.dummyjson.com/products/images/accessories/apple-watch-series-7/1.png',
        onHand: 60,
      },
    ],
  },
  {
    slug: 'electronica',
    name: 'Electrónica',
    products: [
      {
        slug: 'parlante-bluetooth-10w',
        sku: 'PAR-10W',
        name: 'Parlante Bluetooth 10W',
        description:
          'Parlante portátil con sonido estéreo, resistencia al agua IPX6 y 12 horas de reproducción continua.',
        priceMinor: 18990n,
        thumbnail: 'https://cdn.dummyjson.com/products/images/accessories/apple-watch-series-7/1.png',
        onHand: 45,
      },
      {
        slug: 'cargador-inalambrico-15w',
        sku: 'CAR-15W',
        name: 'Cargador Inalámbrico 15W',
        description:
          'Base de carga inalámbrica Qi de 15W con protección contra sobrecarga y diseño anti-deslizante.',
        priceMinor: 7490n,
        thumbnail: 'https://cdn.dummyjson.com/products/images/accessories/apple-watch-series-7/1.png',
        onHand: 100,
      },
    ],
  },
  {
    slug: 'almacenamiento',
    name: 'Almacenamiento',
    products: [
      {
        slug: 'disco-ssd-1tb',
        sku: 'DIS-1TB',
        name: 'Disco SSD 1TB USB-C',
        description:
          'SSD portátil de 1TB con interfaz USB-C 3.2 Gen 2, transferencia hasta 1050MB/s y carcasa metálica.',
        priceMinor: 32990n,
        thumbnail: 'https://cdn.dummyjson.com/products/images/accessories/apple-watch-series-7/1.png',
        onHand: 25,
      },
      {
        slug: 'pendrive-64gb',
        sku: 'PEN-64G',
        name: 'Pendrive 64GB USB 3.0',
        description:
          'Memoria USB 3.0 de 64GB con velocidades de lectura de 130MB/s y cuerpo metálico resistente.',
        priceMinor: 4490n,
        thumbnail: 'https://cdn.dummyjson.com/products/images/accessories/apple-watch-series-7/1.png',
        onHand: 120,
      },
    ],
  },
];

async function main(): Promise<void> {
  for (const category of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, active: true },
      create: { slug: category.slug, name: category.name, active: true },
    });

    for (const product of category.products) {
      await prisma.product.upsert({
        where: { slug: product.slug },
        update: {
          sku: product.sku,
          name: product.name,
          description: product.description,
          priceMinor: product.priceMinor,
          currency: 'PEN',
          status: 'PUBLISHED',
          categoryId: cat.id,
          thumbnail: product.thumbnail,
          images: [{ url: product.thumbnail, alt: product.name }],
        },
        create: {
          slug: product.slug,
          sku: product.sku,
          name: product.name,
          description: product.description,
          priceMinor: product.priceMinor,
          currency: 'PEN',
          status: 'PUBLISHED',
          categoryId: cat.id,
          thumbnail: product.thumbnail,
          images: [{ url: product.thumbnail, alt: product.name }],
        },
      });

      await prisma.inventoryItem.upsert({
        where: { sku: product.sku },
        update: { onHand: product.onHand },
        create: { sku: product.sku, onHand: product.onHand, reserved: 0, version: 0 },
      });

      console.log(`Seeded: product ${product.slug} (${product.sku})`);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
