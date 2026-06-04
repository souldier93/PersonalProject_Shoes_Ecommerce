import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

const [router, app, home, allShoes, productDetail, slide, chat, nginx, azureDeploy] = await Promise.all([
  readSource('src/router/index.js'),
  readSource('src/App.vue'),
  readSource('src/components/home/Home.vue'),
  readSource('src/components/home/allShoes/AllShoes.vue'),
  readSource('src/components/shoesDetail/ShoesDetail.vue'),
  readSource('src/components/home/slide/Slide.vue'),
  readSource('src/components/chat/ChatWidget.vue'),
  readSource('nginx.conf'),
  readFile(new URL('../../scripts/azure/deploy-container-apps.ps1', import.meta.url), 'utf8'),
])

assert.doesNotMatch(router, /import\s+Home\s+from/, 'Home route should not be in the initial route bundle')
assert.match(
  router,
  /component:\s*\(\)\s*=>\s*import\(["']\.\.\/components\/home\/Home\.vue["']\)/,
  'Home route should be loaded through a dynamic import',
)
assert.match(app, /defineAsyncComponent/, 'Non-critical shell components should load asynchronously')

assert.match(home, /DeferredSection/, 'Below-the-fold home sections should be mounted on demand')
assert.match(allShoes, /PRODUCTS_CACHE_TTL_MS/, 'Product listing should reuse a short-lived client cache')
assert.match(
  allShoes,
  /key === 'sort' && value === DEFAULT_SORT/,
  'Default product sort should not force the heavier filtered API path',
)
assert.match(
  allShoes,
  /:loading="index < eagerImageCount \? 'eager' : 'lazy'"/,
  'Above-the-fold product images should be requested eagerly',
)
assert.match(
  allShoes,
  /PRODUCT_SCROLL_RESTORE_KEY/,
  'Product listing should persist the clicked product for back navigation restoration',
)
assert.match(
  allShoes,
  /data-product-id/,
  'Product cards should expose a stable product id target for scroll restoration',
)
assert.match(
  allShoes,
  /restoreProductScrollPosition/,
  'Product listing should restore scroll after products render',
)
assert.match(
  allShoes,
  /viewportOffset/,
  'Product listing should restore the clicked card to its mobile viewport position',
)
assert.match(
  allShoes,
  /PRODUCT_SCROLL_RESTORE_MIN_DURATION_MS/,
  'Product listing should keep the clicked card anchored through late mobile layout shifts',
)
assert.match(
  allShoes,
  /PRODUCT_SCROLL_RESTORE_FRAME_LIMIT/,
  'Product listing should keep restoring across animation frames until mobile layout settles',
)
assert.match(
  allShoes,
  /PRODUCT_SCROLL_RESTORE_STABLE_FRAMES/,
  'Product listing should wait for the clicked card to stay in place before clearing restore data',
)
assert.match(
  allShoes,
  /PRODUCT_SCROLL_RESTORE_MOBILE_HEADER_OFFSET_PX/,
  'Mobile scroll restore should keep the clicked product below the fixed header',
)
assert.match(
  allShoes,
  /\.product-card\s*\{[\s\S]*?content-visibility:\s*visible;[\s\S]*?\}/,
  'Mobile product cards should render with real heights so back navigation can anchor correctly',
)
assert.match(
  allShoes,
  /@media\s*\(min-width:\s*640px\)\s*\{[\s\S]*?\.product-card\s*\{[\s\S]*?content-visibility:\s*auto;/,
  'Product card content-visibility optimization should only apply from tablet widths upward',
)
assert.match(
  router,
  /to\.name\s*===\s*["']Products["'][\s\S]*from\.name\s*===\s*["']ShoesDetail["']/,
  'Products route should let the listing component handle back-navigation scroll from detail pages',
)
assert.doesNotMatch(
  productDetail,
  /params:\s*\{\s*sort:\s*['"]rating['"]\s*\}/,
  'Product detail related-products fetch should not force the heavier filtered API path',
)
assert.match(slide, /preload="none"/, 'Hero video should not download during initial navigation')
assert.match(slide, /loading="eager"/, 'The first hero image should remain discoverable for LCP')

assert.doesNotMatch(
  chat,
  /onMounted\(async\s*\(\)\s*=>\s*\{[\s\S]*?ensureConversation\(\)/,
  'Hidden chat should not open a conversation during page load',
)
assert.match(
  chat,
  /const openChat[\s\S]*?ensureConversation\(\)/,
  'Chat should still initialize when opened',
)

assert.match(nginx, /gzip\s+on;/, 'Production static responses should use gzip compression')
assert.match(nginx, /immutable/, 'Hashed Vite bundles should use immutable caching')
assert.match(azureDeploy, /\$BackendMinReplicas\s+=\s+1/, 'Backend should keep one warm replica by default')
assert.match(azureDeploy, /\$FrontendMinReplicas\s+=\s+1/, 'Frontend should keep one warm replica by default')
assert.match(
  azureDeploy,
  /--min-replicas\s+\$BackendMinReplicas/,
  'Backend deploy should apply the configured minimum replica count',
)
assert.match(
  azureDeploy,
  /--min-replicas\s+\$FrontendMinReplicas/,
  'Frontend deploy should apply the configured minimum replica count',
)

console.log('Initial-load performance guard passed.')
