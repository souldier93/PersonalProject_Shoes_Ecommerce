import { expect, test } from '@playwright/test'

const imageDataUrl =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640"%3E%3Crect width="640" height="640" fill="%23f3f4f6"/%3E%3Cpath d="M120 365c130-45 265-45 400 0 23 8 35 31 26 54-8 22-32 34-55 26-111-37-224-37-337 0-22 8-47-4-55-26-8-23 4-46 21-54z" fill="%23111827"/%3E%3C/svg%3E'

const products = Array.from({ length: 24 }, (_, index) => {
  const productId = String(9001 + index)

  return {
    productId,
    name: `Restore Test Shoe ${index + 1}`,
    category: index % 2 === 0 ? 'men' : 'women',
    productType: 'running',
    collection: 'Scroll Restore',
    color: 'Black',
    colors: ['Black', 'White'],
    stock: 40,
    rating: 4.7,
    reviewCount: 24,
    price: 2500000 + index * 10000,
    thumbnail: imageDataUrl,
  }
})

const productDetail = (productId) => {
  const product = products.find((item) => item.productId === productId) || products[0]

  return {
    productId: product.productId,
    name: product.name,
    category: product.category,
    productType: product.productType,
    collection: product.collection,
    price: product.price,
    colors: [
      {
        colorName: product.color,
        category: product.category,
        productType: product.productType,
        collection: product.collection,
        price: product.price,
        thumbnail: imageDataUrl,
        images: [imageDataUrl],
        sizes: [
          { size: '40', stock: 8 },
          { size: '41', stock: 9 },
          { size: '42', stock: 10 },
        ],
        stock: product.stock,
        rating: product.rating,
        reviewCount: product.reviewCount,
        styleCode: `RESTORE-${product.productId}`,
        description: 'A test product used to verify mobile back-navigation scroll restoration.',
      },
    ],
  }
}

const productScrollRestoreKey = 'ptt-product-scroll-restore'

const mockApi = async (page) => {
  await page.route('http://localhost:3000/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname

    if (path === '/shoes') {
      await route.fulfill({ json: products })
      return
    }

    if (path.startsWith('/shoes/detail/')) {
      await route.fulfill({ json: productDetail(path.split('/').pop()) })
      return
    }

    if (path.startsWith('/shoes/related/')) {
      await route.fulfill({ json: products.slice(0, 8) })
      return
    }

    if (path.startsWith('/reviews/product/')) {
      await route.fulfill({ json: { reviews: [], summary: { total: 0, average: 0 } } })
      return
    }

    if (path.startsWith('/wishlist/user/')) {
      await route.fulfill({ json: { items: [], total: 0 } })
      return
    }

    await route.fulfill({ json: {} })
  })
}

test('catalog reports an API failure and recovers on retry', async ({ page }) => {
  await mockApi(page)
  let unavailable = true
  await page.route('http://localhost:3000/shoes', async (route) => {
    if (unavailable) await route.abort('failed')
    else await route.fulfill({ json: products })
  })
  await page.goto('/')
  await page.getByTestId('catalog-section').scrollIntoViewIfNeeded()
  await expect(page.getByRole('alert')).toContainText('Unable to load products')
  await expect(page.getByText('No products match your filters.')).toHaveCount(0)
  unavailable = false
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page.locator('[data-product-id="9001"]')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('mobile back navigation restores the tapped home product after delayed sections settle', async ({ page }) => {
  await mockApi(page)

  let delayedFeatureImportCount = 0
  let releaseFeatureImport
  const featureImportGate = new Promise((resolve) => {
    releaseFeatureImport = resolve
  })

  await page.route('**/src/components/home/featured/Feature.vue*', async (route) => {
    delayedFeatureImportCount += 1
    await featureImportGate

    try {
      await route.continue()
    } catch {
      // The original import can be cancelled while navigating to detail; later imports reuse the gate.
    }
  })

  await page.goto('/')
  await page.evaluate(() => window.scrollTo(0, 1250))

  const selectedProductId = products[13].productId
  const selectedProduct = page.locator(`[data-product-id="${selectedProductId}"]`)
  await expect(selectedProduct).toBeVisible()

  await selectedProduct.evaluate((element) => {
    window.scrollTo({
      top: window.scrollY + element.getBoundingClientRect().top - 220,
      behavior: 'auto',
    })
  })

  const beforeTop = await selectedProduct.evaluate((element) =>
    Math.round(element.getBoundingClientRect().top),
  )

  await selectedProduct.click()
  await expect(page).toHaveURL(new RegExp(`/shoes/${selectedProductId}$`))
  await expect(page.getByRole('heading', { name: `Restore Test Shoe 14` })).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await expect(selectedProduct).toBeVisible()
  await page.waitForTimeout(3600)
  expect(delayedFeatureImportCount).toBeGreaterThan(0)
  releaseFeatureImport()
  await page.waitForTimeout(1200)

  const afterTop = await selectedProduct.evaluate((element) =>
    Math.round(element.getBoundingClientRect().top),
  )

  expect(afterTop).toBeGreaterThanOrEqual(112)
  expect(Math.abs(afterTop - beforeTop)).toBeLessThanOrEqual(12)
})

test('mobile home return restores the tapped product without native saved scroll', async ({ page }) => {
  await mockApi(page)

  await page.goto('/')
  await page.getByTestId('catalog-section').scrollIntoViewIfNeeded()

  const selectedProductId = products[15].productId
  const selectedProduct = page.locator(`[data-product-id="${selectedProductId}"]`)
  await expect(selectedProduct).toBeVisible()

  await selectedProduct.evaluate((element) => {
    window.scrollTo({
      top: window.scrollY + element.getBoundingClientRect().top - 220,
      behavior: 'auto',
    })
  })

  const beforeTop = await selectedProduct.evaluate((element) =>
    Math.round(element.getBoundingClientRect().top),
  )

  await selectedProduct.click()
  await expect(page).toHaveURL(new RegExp(`/shoes/${selectedProductId}$`))

  await page.goto('/')
  await page.waitForTimeout(3500)
  await expect(selectedProduct).toBeVisible()

  const afterTop = await selectedProduct.evaluate((element) =>
    Math.round(element.getBoundingClientRect().top),
  )

  expect(afterTop).toBeGreaterThanOrEqual(112)
  expect(Math.abs(afterTop - beforeTop)).toBeLessThanOrEqual(12)
})

test('fresh mobile home load restores a pending tapped product state', async ({ page }) => {
  await mockApi(page)

  const selectedProductId = products[17].productId
  await page.addInitScript(
    ({ key, productId }) => {
      window.sessionStorage.setItem(
        key,
        JSON.stringify({
          productId,
          route: '/',
          scrollY: 1500,
          viewportOffset: 220,
          savedAt: Date.now(),
        }),
      )
    },
    { key: productScrollRestoreKey, productId: selectedProductId },
  )

  await page.goto('/')
  await page.waitForTimeout(3500)

  const selectedProduct = page.locator(`[data-product-id="${selectedProductId}"]`)
  await expect(selectedProduct).toBeVisible()

  const afterTop = await selectedProduct.evaluate((element) =>
    Math.round(element.getBoundingClientRect().top),
  )

  expect(afterTop).toBeGreaterThanOrEqual(112)
  expect(Math.abs(afterTop - 220)).toBeLessThanOrEqual(12)
})
