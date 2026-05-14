const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
} = require('@aws-sdk/client-s3');

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
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-e7f6a07e25ff4108aeb63c55fda4d1aa.r2.dev';
const R2_BUCKET = process.env.R2_BUCKET || 'nike-shoes';
const PRODUCT_ID_PREFIX = process.env.PRODUCT_ID_PREFIX || '9';
const PRODUCT_IDS = (process.env.PRODUCT_IDS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const FORCE_UPLOAD = process.env.FORCE_UPLOAD === 'true';

const requiredEnv = ['R2_ENDPOINT', 'R2_ACCESS_KEY', 'R2_SECRET_KEY'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing ${key}. Please check .env before importing Nike media to R2.`);
  }
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

const shoeDetailSchema = new mongoose.Schema({}, { collection: 'shoesDetail', strict: false });
const shoeSchema = new mongoose.Schema({}, { collection: 'shoes', strict: false });
const ShoeDetail = mongoose.model('R2ImportShoeDetail', shoeDetailSchema);
const Shoe = mongoose.model('R2ImportShoe', shoeSchema);

const isR2Url = (url = '') => url.startsWith(R2_PUBLIC_URL);
const isVideo = (url = '') => /\.(mp4|webm|mov|avi|mkv|m4v)(\?|$)/i.test(url);

const sanitizeSegment = (value = '') =>
  String(value)
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, ' ')
    .slice(0, 120);

const colorFolder = (styleCode, colorName) => {
  const color = sanitizeSegment(colorName).replace(/\s+/g, '_');
  return `${sanitizeSegment(styleCode)}_${color}`;
};

const extensionFor = (url, contentType) => {
  const fromUrl = new URL(url).pathname.match(/\.([a-z0-9]+)$/i)?.[1];
  if (fromUrl) return fromUrl.toLowerCase();
  if (contentType?.includes('jpeg')) return 'jpg';
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('webp')) return 'webp';
  if (contentType?.includes('mp4')) return 'mp4';
  return 'png';
};

const publicUrlForKey = (key) => `${R2_PUBLIC_URL}/${encodeURI(key)}`;

async function objectExists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === 'NotFound') return false;
    throw error;
  }
}

async function uploadMedia(sourceUrl, key) {
  if (!FORCE_UPLOAD && await objectExists(key)) {
    return publicUrlForKey(key);
  }

  const response = await fetch(sourceUrl, {
    headers: { 'user-agent': 'Mozilla/5.0' },
  });

  if (!response.ok) {
    throw new Error(`Cannot download ${sourceUrl}: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const body = Buffer.from(await response.arrayBuffer());

  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));

  return publicUrlForKey(key);
}

async function importColor(product, color) {
  const sourceImages = (color.images || []).filter(Boolean);
  const folder = sanitizeSegment(product.name);
  const subfolder = colorFolder(color.styleCode || 'style', color.colorName || 'color');
  let imageIndex = 0;
  let videoIndex = 0;

  const importedImages = [];
  for (const sourceUrl of sourceImages) {
    if (isR2Url(sourceUrl)) {
      importedImages.push(sourceUrl);
      continue;
    }

    const mediaType = isVideo(sourceUrl) ? 'video' : 'image';
    const number = mediaType === 'video' ? videoIndex++ : imageIndex++;
    const response = await fetch(sourceUrl, {
      method: 'HEAD',
      headers: { 'user-agent': 'Mozilla/5.0' },
    }).catch(() => null);
    const contentType = response?.headers?.get('content-type') || '';
    const ext = extensionFor(sourceUrl, contentType);
    const filename = `${mediaType}_${String(number).padStart(3, '0')}.${ext}`;
    const key = `${folder}/${subfolder}/${filename}`;

    importedImages.push(await uploadMedia(sourceUrl, key));
  }

  color.images = importedImages;
  color.thumbnail = importedImages.find((url) => !isVideo(url)) || importedImages[0] || color.thumbnail;
  return color;
}

async function run() {
  await mongoose.connect(MONGO_URI);

  const filter = PRODUCT_IDS.length
    ? { productId: { $in: PRODUCT_IDS } }
    : { productId: { $regex: `^${PRODUCT_ID_PREFIX}` } };
  const products = await ShoeDetail.find(filter).lean();

  for (const product of products) {
    const colors = [];
    for (const color of product.colors || []) {
      colors.push(await importColor(product, { ...color }));
    }

    const firstColor = colors[0] || {};
    await ShoeDetail.updateOne(
      { productId: product.productId },
      { $set: { colors } },
    );
    await Shoe.updateOne(
      { productId: product.productId },
      {
        $set: {
          thumbnail: firstColor.thumbnail || '',
          color: firstColor.colorName || '',
        },
      },
    );

    console.log(`Imported ${product.productId} - ${product.name} (${colors.length} colors)`);
  }

  await mongoose.disconnect();
  console.log(`Done. Imported Nike media to R2 for ${products.length} products.`);
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
