import { expect, test } from '@playwright/test'

const item = {
  productId: '9001',
  styleCode: 'TEST-9001',
  name: 'Checkout Test Shoe',
  colorName: 'Black',
  size: '40',
  quantity: 1,
  price: 1000000,
  thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E',
}

const prepareCheckout = async (page) => {
  await page.addInitScript((checkoutItem) => {
    localStorage.setItem('shoppingBag:guest', JSON.stringify([checkoutItem]))
    localStorage.setItem('checkoutItems', JSON.stringify([checkoutItem]))
  }, item)
}

const mockStock = async (page) => {
  await page.route('http://localhost:3000/shoes/check-stock-batch', (route) =>
    route.fulfill({
      json: {
        items: [
          {
            productId: item.productId,
            colorName: item.colorName,
            size: item.size,
            quantity: item.quantity,
            availableStock: 10,
            isAvailable: true,
          },
        ],
      },
    }),
  )
}

test('checkout disables payment when no provider is configured', async ({ page }) => {
  await prepareCheckout(page)
  await mockStock(page)
  await page.route('http://localhost:3000/payments/providers', (route) =>
    route.fulfill({ json: { payos: false, stripe: false } }),
  )

  await page.goto('/checkout')

  await expect(page.getByRole('alert')).toContainText('No payment method is available')
  await expect(page.getByRole('radio', { name: /QR \/ Bank transfer/ })).toBeDisabled()
  await expect(page.getByRole('radio', { name: /Visa card \/ Apple Pay/ })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Continue to Payment' })).toBeDisabled()
})

test('checkout displays the backend payment error inline', async ({ page }) => {
  await prepareCheckout(page)
  await mockStock(page)
  await page.route('http://localhost:3000/payments/providers', (route) =>
    route.fulfill({ json: { payos: true, stripe: false } }),
  )
  await page.route('http://localhost:3000/payments', (route) =>
    route.fulfill({
      status: 503,
      json: { message: 'PayOS payment is temporarily unavailable.' },
    }),
  )

  await page.goto('/checkout')
  await page.getByPlaceholder('Email *').fill('checkout-test@example.com')
  await page.getByPlaceholder('First Name *').fill('Checkout')
  await page.getByPlaceholder('Last Name *').fill('Test')
  await page.getByPlaceholder('Start typing a street address or postcode *').fill('Local test address')
  await page.getByPlaceholder('Phone Number *').fill('0900000000')
  await page.getByRole('button', { name: 'Continue to Payment' }).click()

  await expect(page.getByRole('alert')).toContainText('PayOS payment is temporarily unavailable.')
  await expect(page).toHaveURL(/\/checkout$/)
})
