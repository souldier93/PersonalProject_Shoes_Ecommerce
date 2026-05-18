const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nike-store';
const now = new Date().toISOString();
const selectedProductIds = (process.env.PRODUCT_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

const menSizes = ['40', '40.5', '41', '42', '42.5', '43', '44', '44.5', '45'];
const womenSizes = ['36', '36.5', '37.5', '38', '38.5', '39', '40', '40.5'];
const kidsSizes = ['3.5Y', '4Y', '4.5Y', '5Y', '5.5Y', '6Y', '6.5Y', '7Y'];
const apparelSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const extendedApparelSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const sockSizes = ['S', 'M', 'L', 'XL'];
const capSizes = ['S/M', 'M/L', 'L/XL'];
const oneSize = ['ONE SIZE'];

const catalog = [
  {
    productId: '9007',
    name: "Nike Air Force 1 '07",
    category: 'men',
    productType: 'lifestyle',
    collection: 'Air Force 1',
    price: 2875000,
    sourceUrl: 'https://www.nike.com/t/nike-air-force-1-07-jBrhbr/CW2288-111',
    maxColors: 3,
  },
  {
    productId: '9008',
    name: 'Nike Zoom Vomero 5',
    category: 'men',
    productType: 'lifestyle',
    collection: 'Vomero 5',
    price: 4250000,
    sourceUrl: 'https://www.nike.com/t/zoom-vomero-5-shoes-MgsTqZ/BV1358-003',
    maxColors: 5,
  },
  {
    productId: '9009',
    name: 'Nike Free Metcon 6',
    category: 'men',
    productType: 'training',
    collection: 'Metcon',
    price: 3125000,
    sourceUrl: 'https://www.nike.com/t/free-metcon-6-mens-workout-shoes-QFCf19/FJ7127-007',
    maxColors: 5,
  },
  {
    productId: '9010',
    name: 'Nike G.T. Cut 3 Turbo',
    category: 'men',
    productType: 'basketball',
    collection: 'G.T.',
    price: 5250000,
    sourceUrl: 'https://www.nike.com/t/gt-cut-3-turbo-basketball-shoes-Oy26Wabw',
    maxColors: 2,
  },
  {
    productId: '9011',
    name: 'Nike Air Max Plus',
    category: 'men',
    productType: 'lifestyle',
    collection: 'Air Max',
    price: 4750000,
    sourceUrl: 'https://www.nike.com/t/air-max-plus-mens-shoes-x9G2xF/DM0032-041',
    maxColors: 5,
  },
  {
    productId: '9012',
    name: 'Nike Revolution 8',
    category: 'men',
    productType: 'running',
    collection: 'Revolution',
    price: 1875000,
    sourceUrl: 'https://www.nike.com/t/revolution-8-mens-road-running-shoes-U0b8oy8S/HJ9198-006',
    maxColors: 5,
  },
  {
    productId: '9013',
    name: 'Nike Structure 26',
    category: 'men',
    productType: 'running',
    collection: 'Structure',
    price: 3625000,
    sourceUrl: 'https://www.nike.com/t/structure-26-mens-road-running-shoes-M4sx9fru/HJ1102-001',
    maxColors: 5,
  },
  {
    productId: '9014',
    name: 'Nike Dunk Low Big Kids',
    category: 'kids',
    productType: 'lifestyle',
    collection: 'Dunk',
    price: 2300000,
    sourceUrl: 'https://www.nike.com/t/dunk-low-big-kids-shoes-C6spohtb/IU7766-134',
    maxColors: 5,
  },
  {
    productId: '9015',
    name: 'Nike Sportswear Club Fleece Pullover Hoodie',
    category: 'men',
    productType: 'apparel',
    collection: 'Sportswear Club Fleece',
    price: 1625000,
    sourceUrl: 'https://www.nike.com/t/sportswear-club-pullover-fleece-hoodie-td1iYPos',
    maxColors: 6,
    sizeGroup: 'extendedApparel',
    minImages: 4,
  },
  {
    productId: '9016',
    name: "Nike Primary Men's Dri-FIT Short-Sleeve Top",
    category: 'men',
    productType: 'apparel',
    collection: 'Primary Dri-FIT',
    price: 1500000,
    sourceUrl: 'https://www.nike.com/t/primary-mens-dri-fit-short-sleeve-versatile-top-WN7xmT7b/DV9831-010',
    maxColors: 5,
    sizeGroup: 'apparel',
    minImages: 4,
  },
  {
    productId: '9017',
    name: "Nike Sportswear Essential Women's T-Shirt",
    category: 'women',
    productType: 'apparel',
    collection: 'Sportswear Essential',
    price: 750000,
    sourceUrl: 'https://www.nike.com/t/sportswear-essential-womens-t-shirt-gzjLvAod/FD4149-423',
    maxColors: 5,
    sizeGroup: 'apparel',
    minImages: 4,
  },
  {
    productId: '9018',
    name: "Nike Sportswear Phoenix Fleece Women's Pants",
    category: 'women',
    productType: 'apparel',
    collection: 'Phoenix Fleece',
    price: 1875000,
    sourceUrl: 'https://www.nike.com/t/sportswear-phoenix-fleece-womens-oversized-high-waisted-graphic-pants-g5H5cLOn/IF0254-410',
    maxColors: 4,
    sizeGroup: 'apparel',
    minImages: 4,
  },
  {
    productId: '9019',
    name: 'Nike Everyday Plus Cushioned Training Crew Socks',
    category: 'men',
    productType: 'accessories',
    collection: 'Everyday Plus',
    price: 550000,
    sourceUrl: 'https://www.nike.com/t/everyday-plus-cushioned-training-crew-socks-3-pairs-7AnJRwu0/SX6888-964',
    maxColors: 5,
    sizeGroup: 'socks',
    minImages: 3,
  },
  {
    productId: '9020',
    name: 'Nike Heritage Backpack',
    category: 'men',
    productType: 'accessories',
    collection: 'Heritage',
    price: 925000,
    sourceUrl: 'https://www.nike.com/t/heritage-backpack-25l-JKmRND/DC4244-010',
    maxColors: 5,
    sizeGroup: 'oneSize',
    minImages: 3,
  },
  {
    productId: '9021',
    name: 'Nike Club Unstructured JDI Cap',
    category: 'men',
    productType: 'accessories',
    collection: 'Club',
    price: 650000,
    sourceUrl: 'https://www.nike.com/t/club-unstructured-jdi-cap-Xr7txF',
    maxColors: 5,
    sizeGroup: 'oneSize',
    minImages: 2,
  },
  {
    productId: '9022',
    name: 'Nike Brasilia Training Duffel Bag',
    category: 'men',
    productType: 'accessories',
    collection: 'Brasilia',
    price: 1375000,
    sourceUrl: 'https://www.nike.com/t/brasilia-training-duffel-bag-medium-60l-z65fGwfh',
    maxColors: 5,
    sizeGroup: 'oneSize',
    minImages: 3,
  },
  {
    productId: '9023',
    name: 'Nike P-6000',
    category: 'men',
    productType: 'lifestyle',
    collection: 'P-6000',
    price: 2875000,
    sourceUrl: 'https://www.nike.com/t/p-6000-shoes-XkgpKW/CD6404-108',
    maxColors: 8,
  },
  {
    productId: '9024',
    name: 'Nike Vomero Premium',
    category: 'men',
    productType: 'running',
    collection: 'Vomero',
    price: 5750000,
    sourceUrl: 'https://www.nike.com/t/vomero-premium-mens-road-running-shoes-l11miwwa/HQ2050-101',
    maxColors: 4,
  },
  {
    productId: '9025',
    name: 'Nike Pegasus Premium',
    category: 'men',
    productType: 'running',
    collection: 'Pegasus',
    price: 5500000,
    sourceUrl: 'https://www.nike.com/t/pegasus-premium-mens-road-running-shoes-kWXqW9yR/HQ2592-106',
    maxColors: 8,
  },
  {
    productId: '9026',
    name: 'Air Jordan 1 Retro Low OG Banned',
    category: 'men',
    productType: 'lifestyle',
    collection: 'Air Jordan 1',
    price: 3625000,
    sourceUrl: 'https://www.nike.com/t/air-jordan-1-retro-low-og-banned-mens-shoes-9ceTZAxR/IW6276-001',
    maxColors: 2,
  },
  {
    productId: '9027',
    name: 'Nike ACG Zegama',
    category: 'men',
    productType: 'running',
    collection: 'ACG',
    price: 4500000,
    sourceUrl: 'https://www.nike.com/t/acg-zegama-mens-trail-running-shoes-R6m2RvQq/HV8113-103',
    maxColors: 4,
  },
  {
    productId: '9028',
    name: 'Nike Air Max Moto 2K',
    category: 'men',
    productType: 'lifestyle',
    collection: 'Air Max',
    price: 3750000,
    sourceUrl: 'https://www.nike.com/t/air-max-moto-2k-mens-shoes-sHpe9Gv4/IO9279-101',
    maxColors: 6,
  },
  {
    productId: '9029',
    name: 'Nike Air Max 270',
    category: 'women',
    productType: 'lifestyle',
    collection: 'Air Max',
    price: 4250000,
    sourceUrl: 'https://www.nike.com/t/air-max-270-womens-shoes-Pgb94t/HJ3222-500',
    maxColors: 7,
  },
  {
    productId: '9030',
    name: 'Nike Ava Rover',
    category: 'women',
    productType: 'lifestyle',
    collection: 'Ava Rover',
    price: 3625000,
    sourceUrl: 'https://www.nike.com/t/ava-rover-shoes-Ow09rOwc/DX4215-102',
    maxColors: 5,
  },
  {
    productId: '9031',
    name: 'Nike Dunk Low',
    category: 'women',
    productType: 'lifestyle',
    collection: 'Dunk',
    price: 3000000,
    sourceUrl: 'https://www.nike.com/t/dunk-low-womens-shoes-ppQwKZ/IV2040-600',
    maxColors: 8,
  },
  {
    productId: '9032',
    name: 'Nike 24.7 PerfectStretch',
    category: 'men',
    productType: 'apparel',
    collection: '24.7',
    price: 2500000,
    sourceUrl: 'https://www.nike.com/t/247-perfectstretch-mens-dri-fit-uv-button-up-shirt-VRTJxuVa/IF2734-451',
    maxColors: 5,
    sizeGroup: 'apparel',
    minImages: 4,
  },
  {
    productId: '9033',
    name: 'Nike Sportswear T-Shirt',
    category: 'men',
    productType: 'apparel',
    collection: 'Sportswear',
    price: 1050000,
    sourceUrl: 'https://www.nike.com/t/sportswear-mens-t-shirt-7CoxMH11/IR6913-101',
    maxColors: 4,
    sizeGroup: 'apparel',
    minImages: 4,
  },
  {
    productId: '9034',
    name: 'Nike Club Fleece Shorts',
    category: 'men',
    productType: 'apparel',
    collection: 'Club',
    price: 1625000,
    sourceUrl: 'https://www.nike.com/t/club-mens-fleece-shorts-fKfOAroW/IQ5903-657',
    maxColors: 4,
    sizeGroup: 'apparel',
    minImages: 4,
  },
  {
    productId: '9035',
    name: 'Nike Tech Helios Jacket',
    category: 'men',
    productType: 'apparel',
    collection: 'Tech Helios',
    price: 3750000,
    sourceUrl: 'https://www.nike.com/t/tech-helios-mens-dri-fit-full-zip-jacket-Wtb98Qim/IM1333-382',
    maxColors: 4,
    sizeGroup: 'extendedApparel',
    minImages: 4,
  },
  {
    productId: '9036',
    name: 'Nike Varsity Elite Backpack',
    category: 'men',
    productType: 'accessories',
    collection: 'Varsity Elite',
    price: 2375000,
    sourceUrl: 'https://www.nike.com/t/varsity-elite-backpack-32l-ktBkrm/HM9965-819',
    maxColors: 6,
    sizeGroup: 'oneSize',
    minImages: 3,
  },
  {
    productId: '9037',
    name: 'Nike Caddy Golf Towel',
    category: 'men',
    productType: 'accessories',
    collection: 'Golf',
    price: 900000,
    sourceUrl: 'https://www.nike.com/t/caddy-golf-towel-LFCyfppx/N1013741-740',
    maxColors: 3,
    sizeGroup: 'oneSize',
    minImages: 2,
  },
];

const stockFor = (sizes, start = 10) =>
  sizes.map((size, index) => ({
    size,
    stock: Math.max(2, start - (index % 6)),
  }));

const sizesFor = (config) => {
  if (config.sizeGroup === 'apparel') return apparelSizes;
  if (config.sizeGroup === 'extendedApparel') return extendedApparelSizes;
  if (config.sizeGroup === 'socks') return sockSizes;
  if (config.sizeGroup === 'caps') return capSizes;
  if (config.sizeGroup === 'oneSize') return oneSize;
  if (config.category === 'women') return womenSizes;
  if (config.category === 'kids') return kidsSizes;
  return menSizes;
};

const cleanText = (value = '') => {
  if (value && typeof value === 'object') {
    value = value.text || value.value || value.markdown || value.description || '';
  }

  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const extractNextData = (html, sourceUrl) => {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error(`Could not find Nike product JSON for ${sourceUrl}`);
  }
  return JSON.parse(match[1]);
};

const imageUrl = (image) =>
  image?.url ||
  image?.properties?.squarishURL?.url ||
  image?.properties?.portraitURL?.url ||
  image?.properties?.landscapeURL?.url ||
  JSON.stringify(image).match(/https:\/\/static\.nike\.com[^"\\]+/)?.[0] ||
  '';

const productImages = (product) => {
  const seen = new Set();
  return (product.contentImages || [])
    .map(imageUrl)
    .filter((url) => url.includes('/a/images/'))
    .map((url) => url.replace('/t_default/', '/t_web_pdp_535_v2/f_auto/'))
    .filter((url) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    })
    .slice(0, 11);
};

async function nikeProductsFor(config) {
  const response = await fetch(config.sourceUrl, {
    headers: { 'user-agent': 'Mozilla/5.0' },
  });

  if (!response.ok) {
    throw new Error(`Nike request failed ${response.status} for ${config.sourceUrl}`);
  }

  const html = await response.text();
  const data = extractNextData(html, config.sourceUrl);
  const products = Object.values(data.props?.pageProps?.productGroups?.[0]?.products || {});

  return products
    .filter((product) => product?.styleColor && productImages(product).length >= (config.minImages || 5))
    .slice(0, config.maxColors)
    .map((product, index) => {
      const images = productImages(product);
      const productInfo = product.productInfo || {};
      const fallbackDescription = `${config.name} in ${product.colorDescription}.`;

      return {
        colorName: product.colorDescription || product.styleColor,
        hex: index === 0 ? '#111111' : '',
        thumbnail: images[0],
        images,
        sizes: stockFor(sizesFor(config), 12 - index),
        styleCode: product.styleColor,
        category: config.category,
        productType: config.productType,
        collection: config.collection,
        createdAt: now,
        description: cleanText(productInfo.productDescription) || fallbackDescription,
        materialNote: cleanText((productInfo.productDetails || [])[0]) || '',
        origin: 'Vietnam',
        rating: 4.7,
        reviewCount: 250 + index * 83,
        updatedAt: now,
        price: config.price,
      };
    });
}

async function seed() {
  await mongoose.connect(MONGO_URI);

  const shoeSchema = new mongoose.Schema({}, { collection: 'shoes', strict: false });
  const detailSchema = new mongoose.Schema({}, { collection: 'shoesDetail', strict: false });
  const Shoe = mongoose.model('CatalogSeedShoe', shoeSchema);
  const ShoeDetail = mongoose.model('CatalogSeedShoeDetail', detailSchema);

  const productsToSeed = selectedProductIds.length
    ? catalog.filter((item) => selectedProductIds.includes(item.productId))
    : catalog;

  for (const config of productsToSeed) {
    let colors = [];
    try {
      colors = await nikeProductsFor(config);
    } catch (error) {
      console.error(`Skipped ${config.name}: ${error.message}`);
      continue;
    }

    if (!colors.length) {
      console.warn(`Skipped ${config.name}: no usable colors found`);
      continue;
    }

    const firstColor = colors[0];
    const detail = {
      productId: config.productId,
      name: config.name,
      category: config.category,
      productType: config.productType,
      collection: config.collection,
      price: config.price,
      sourceUrl: config.sourceUrl,
      colors,
    };

    await ShoeDetail.updateOne({ productId: config.productId }, { $set: detail }, { upsert: true });
    await Shoe.updateOne(
      { productId: config.productId },
      {
        $set: {
          productId: config.productId,
          name: config.name,
          category: config.category,
          productType: config.productType,
          collection: config.collection,
          price: firstColor.price,
          color: firstColor.colorName,
          thumbnail: firstColor.thumbnail,
        },
      },
      { upsert: true },
    );

    console.log(`Seeded ${config.productId} - ${config.name} (${colors.length} colors)`);
  }

  await mongoose.disconnect();
  console.log('Done. Nike catalog seed completed.');
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
