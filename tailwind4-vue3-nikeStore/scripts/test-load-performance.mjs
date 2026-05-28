import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

const [router, app, home, allShoes, slide, chat, nginx] = await Promise.all([
  readSource('src/router/index.js'),
  readSource('src/App.vue'),
  readSource('src/components/home/Home.vue'),
  readSource('src/components/home/allShoes/AllShoes.vue'),
  readSource('src/components/home/slide/Slide.vue'),
  readSource('src/components/chat/ChatWidget.vue'),
  readSource('nginx.conf'),
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

console.log('Initial-load performance guard passed.')
