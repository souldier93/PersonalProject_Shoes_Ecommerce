<template>
  <footer class="w-full bg-black text-white mt-20">
    <div class="w-full max-w-7xl mx-auto px-4 py-12">
      <!-- Main Footer Content -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <!-- Resources Column -->
        <div>
          <h3 class="font-semibold text-sm mb-6">Resources</h3>
          <ul class="space-y-3">
            <li v-for="item in resources" :key="item">
              <a href="#" class="text-gray-400 hover:text-white text-sm transition">
                {{ item }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Help Column -->
        <div>
          <h3 class="font-semibold text-sm mb-6">Help</h3>
          <ul class="space-y-3">
            <li v-for="item in help" :key="item">
              <a href="#" class="text-gray-400 hover:text-white text-sm transition">
                {{ item }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Company Column -->
        <div>
          <h3 class="font-semibold text-sm mb-6">Company</h3>
          <ul class="space-y-3">
            <li v-for="item in company" :key="item">
              <a href="#" class="text-gray-400 hover:text-white text-sm transition">
                {{ item }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Location -->
        <div class="flex justify-start md:justify-end">
          <button class="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clip-rule="evenodd"/>
            </svg>
            Vietnam
          </button>
        </div>
      </div>

      <!-- Bottom Footer -->
      <div class="border-t border-gray-800 pt-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <!-- Copyright -->
          <p class="text-xs text-gray-400">
            © 2025 Nike, Inc. All rights reserved
          </p>

          <!-- Footer Links -->
          <div class="flex flex-wrap gap-6">
            <button class="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition">
              Guides
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <a href="#" class="text-xs text-gray-400 hover:text-white transition">
              Terms of Sale
            </a>
            <a href="#" class="text-xs text-gray-400 hover:text-white transition">
              Terms of Use
            </a>
            <a href="#" class="text-xs text-gray-400 hover:text-white transition">
              Nike Privacy Policy
            </a>
            <a href="#" class="text-xs text-gray-400 hover:text-white transition">
              Privacy Settings
            </a>
          </div>
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
      resources: [
        'Find A Store',
        'Become A Member',
        'Running Shoe Finder',
        'Nike Coaching',
        'Send Us Feedback'
      ],
      help: [
        'Get Help',
        'Order Status',
        'Delivery',
        'Returns',
        'Payment Options',
        'Contact Us'
      ],
      company: [
        'About Nike',
        'News',
        'Careers',
        'Investors',
        'Sustainability',
        'Impact',
        'Report a Concern'
      ]
    }
  }
}
</script>

<style scoped>
/* Additional custom styles if needed */
</style>