<template>
  <footer class="mt-20 w-full bg-neutral-950 text-white">
    <div class="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
      <div class="grid gap-10 lg:grid-cols-[1.35fr_2fr]">
        <div class="max-w-sm">
          <router-link to="/" class="inline-flex rounded-md bg-white p-2 transition hover:opacity-90" aria-label="PTT Style home">
            <img src="/assets/img/ptt-style-logo.svg" alt="PTT Style" class="h-11 w-auto" />
          </router-link>

          <p class="mt-5 text-sm leading-6 text-neutral-300">
            Footwear, apparel, and everyday fashion pieces curated for clean fits, easy movement, and confident personal style.
          </p>

          <button class="mt-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-300 transition hover:text-white">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21s7-5.33 7-12a7 7 0 10-14 0c0 6.67 7 12 7 12z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
            </svg>
            Vietnam
          </button>
        </div>

        <div class="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h3 class="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Shop</h3>
            <ul class="space-y-3">
              <li v-for="item in shopLinks" :key="item.label">
                <router-link :to="item.to" class="text-sm text-neutral-400 transition hover:text-white">
                  {{ item.label }}
                </router-link>
              </li>
            </ul>
          </div>

          <div>
            <h3 class="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Support</h3>
            <ul class="space-y-3">
              <li v-for="item in supportLinks" :key="item.label">
                <router-link :to="item.to" class="text-sm text-neutral-400 transition hover:text-white">
                  {{ item.label }}
                </router-link>
              </li>
            </ul>
          </div>

          <div>
            <h3 class="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Company</h3>
            <ul class="space-y-3">
              <li v-for="item in companyLinks" :key="item.label">
                <a href="#" class="text-sm text-neutral-400 transition hover:text-white">
                  {{ item.label }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
        <p class="text-xs text-neutral-500">
          (c) 2025 PTT Style. All rights reserved.
        </p>

        <div class="flex flex-wrap gap-x-6 gap-y-3">
          <a v-for="item in legalLinks" :key="item" href="#" class="text-xs text-neutral-500 transition hover:text-white">
            {{ item }}
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'FooterComponent',
  data() {
    return {
      shopLinks: [
        { label: 'New Arrivals', to: '/products?sort=featured' },
        { label: 'Men', to: '/products?category=men' },
        { label: 'Women', to: '/products?category=women' },
        { label: 'Accessories', to: '/products?productType=accessories' },
      ],
      supportLinks: [
        { label: 'Order Status', to: '/my-orders' },
        { label: 'Delivery', to: '/checkout' },
        { label: 'Returns', to: '/my-orders' },
        { label: 'Payment Options', to: '/bag' },
      ],
      companyLinks: [
        { label: 'About PTT Style' },
        { label: 'Careers' },
        { label: 'Sustainability' },
        { label: 'Contact Us' },
      ],
      legalLinks: [
        'Terms of Sale',
        'Terms of Use',
        'Privacy Policy',
        'Privacy Settings',
      ],
    }
  },
}
</script>
