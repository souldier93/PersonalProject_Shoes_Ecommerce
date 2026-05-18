<template>
    <div v-if="product" class="mx-auto max-w-7xl px-4 pt-8 pb-12 sm:px-6 sm:pt-10 lg:px-8">
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-[88px_minmax(0,1fr)_380px] xl:grid-cols-[96px_minmax(0,680px)_400px]">
            <!-- LEFT - Thumbnails -->
            <div class="order-2 lg:order-1">
                <div class="flex gap-3 overflow-x-auto pb-2 lg:max-h-[680px] lg:flex-col lg:overflow-y-auto lg:pb-0 scrollbar-hide">
                    <div v-for="(img, i) in currentImages" :key="`${img}-${i}`"
                        class="relative aspect-square w-16 shrink-0 bg-gray-100 rounded-md flex items-center justify-center cursor-pointer border-2 transition-all hover:border-gray-400 sm:w-20 lg:w-16 overflow-hidden"
                        :class="selectedImgIndex === i ? 'border-black' : 'border-transparent'"
                        @click="selectedImgIndex = i">

                        <!-- Video Thumbnail -->
                        <video v-if="isVideo(img)" :src="img" class="w-full h-full object-contain transition-opacity duration-200"
                            :class="isMediaLoading(img) ? 'opacity-0' : 'opacity-100'"
                            @loadedmetadata="markMediaLoaded(img)" @canplay="markMediaLoaded(img)" @error="markMediaLoaded(img)" muted
                            preload="metadata">
                        </video>

                        <!-- Image Thumbnail -->
                        <img v-else :src="img" class="w-full h-full object-contain transition-opacity duration-200"
                            :class="isMediaLoading(img) ? 'opacity-0' : 'opacity-100'"
                            @load="markMediaLoaded(img)" @error="markMediaLoaded(img)" />

                        <div v-if="isMediaLoading(img)" class="absolute inset-0 flex items-center justify-center">
                            <span class="h-6 w-6 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin"></span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CENTER - Main Image/Video -->
            <div class="order-1 lg:order-2">
                <div class="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-[#f5f5f5] lg:max-h-[680px]">
                    <!-- Video Player -->
                    <video v-if="isVideo(currentImages[selectedImgIndex])" :src="currentImages[selectedImgIndex]"
                        class="h-full w-full object-contain rounded-lg transition-opacity duration-200"
                        :class="isMediaLoading(currentImages[selectedImgIndex]) ? 'opacity-0' : 'opacity-100'"
                        @loadedmetadata="markMediaLoaded(currentImages[selectedImgIndex])"
                        @canplay="markMediaLoaded(currentImages[selectedImgIndex])"
                        @error="markMediaLoaded(currentImages[selectedImgIndex])" controls autoplay muted loop
                        playsinline>
                        Your browser does not support the video tag.
                    </video>

                    <!-- Image Display -->
                    <img v-else-if="currentImages[selectedImgIndex]" :src="currentImages[selectedImgIndex]"
                        class="h-full w-full object-contain transition-opacity duration-200"
                        :class="isMediaLoading(currentImages[selectedImgIndex]) ? 'opacity-0' : 'opacity-100'"
                        @load="markMediaLoaded(currentImages[selectedImgIndex])"
                        @error="markMediaLoaded(currentImages[selectedImgIndex])" />

                    <div v-if="isMediaLoading(currentImages[selectedImgIndex])" class="absolute inset-0 flex items-center justify-center">
                        <span class="h-10 w-10 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin"></span>
                    </div>
                </div>
            </div>

            <!-- RIGHT - Product Info -->
            <div class="order-3 space-y-6 lg:sticky lg:top-40 lg:self-start">
                <div v-if="productBadge" class="text-orange-600 text-sm font-semibold -mb-1">
                    {{ productBadge }}
                </div>

                <div class="space-y-2">
                    <h1 class="text-2xl font-bold">{{ productName }}</h1>
                    <p class="text-gray-600 text-sm">{{ productSubtitleText }}</p>
                    <p v-if="currentColor?.price" class="text-2xl font-bold">
                        {{ formatPrice(currentColor.price) }}
                    </p>
                    <button @click="saveToWishlist(false)" :disabled="wishlistSaving"
                        class="mt-3 w-full rounded-full border py-3 font-semibold transition"
                        :class="isCurrentWishlistSaved
                            ? 'border-black bg-black text-white hover:bg-gray-800'
                            : 'border-gray-300 hover:border-black'">
                        {{ wishlistSaving ? 'Saving...' : (isCurrentWishlistSaved ? 'Saved to Wishlist' : 'Save to Wishlist') }}
                    </button>
                </div>

                <!-- Color Selector -->
                <div v-if="product.colors?.length > 0">
                    <h3 class="font-semibold mb-3">Select Color</h3>
                    <div class="flex gap-2 flex-wrap">
                        <button v-for="(color, idx) in product.colors" :key="idx" @click="selectColor(idx)"
                            class="w-16 h-16 rounded-lg border-2 relative transition-all hover:scale-105 cursor-pointer"
                            :class="[
                                selectedColorIndex === idx ? 'border-black' : 'border-gray-300',
                                !isColorAvailable(color) && 'opacity-50'
                            ]">
                            <img :src="color.thumbnail || color.images?.[0]"
                                class="w-full h-full object-cover rounded-lg" />

                            <!-- Sold Out Overlay -->
                            <div v-if="!isColorAvailable(color)"
                                class="absolute inset-0 flex items-center justify-center bg-white-10 rounded-lg">
                                <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Size Selector -->
                <div>
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="font-semibold">Select Size</h3>
                        <button @click="showSizeGuide = true" class="text-sm text-gray-600 hover:text-black flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Size Guide
                        </button>
                    </div>

                    <!-- Sold Out Warning -->
                    <div v-if="isCurrentColorSoldOut" class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p class="text-sm text-red-700 font-semibold flex items-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Sold Out
                        </p>
                        <p class="text-xs text-red-600 mt-1">
                            This color is currently unavailable. Please select another color.
                        </p>
                    </div>

                    <!-- Size Grid -->
                    <div v-else-if="currentSizes.length > 0" class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <button v-for="size in currentSizes" :key="size.size" @click="selectSize(size)"
                            class="border rounded-md py-2 px-2 text-sm font-medium relative transition-all text-center min-h-[58px] flex flex-col items-center justify-center"
                            :class="[
                                selectedSize === size.size
                                    ? 'border-black bg-gray-50'
                                    : size.stock === 0
                                        ? 'opacity-60 border-gray-200 line-through hover:border-black'
                                        : 'hover:border-black border-gray-300'
                            ]">
                            <span>{{ size.size }}</span>
                            <span v-if="size.stock === 0" class="text-[11px] text-gray-500 font-normal no-underline">
                                Sold out
                            </span>
                            <span v-else-if="isLowStock(size)" class="text-[11px] text-orange-600 font-semibold no-underline">
                                Only {{ size.stock }} left
                            </span>
                        </button>
                    </div>

                    <div v-if="stockNotice" class="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                        {{ stockNotice }}
                    </div>
                </div>

                <!-- Add to Bag Button -->
                <button @click="addToBag" :disabled="!selectedSize || selectedSizeStock === 0"
                    class="py-4 w-full rounded-full font-semibold transition-all text-base" :class="selectedSize && selectedSizeStock > 0
                        ? 'bg-black text-white hover:bg-gray-800 active:scale-95'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'">
                    {{ selectedSize && selectedSizeStock === 0 ? 'Out of Stock' : (selectedSize ? 'Add to Bag' : 'Select a size') }}
                </button>

                <button v-if="selectedSize && selectedSizeStock === 0" @click="saveToWishlist(true)"
                    class="py-4 w-full rounded-full font-semibold border border-black hover:bg-gray-50 transition">
                    Notify me when size {{ selectedSize }} is back
                </button>

                <div class="rounded-lg border border-gray-200 p-4 space-y-4">
                    <div class="flex items-start gap-3">
                        <svg class="mt-0.5 h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM6 18a2 2 0 100-4 2 2 0 000 4zM18 18a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                        <div class="flex-1">
                            <h3 class="font-semibold">Delivery & Pickup</h3>
                            <p class="mt-1 text-sm text-gray-600">Free standard delivery for members. Estimated arrival {{ deliveryEstimate }}.</p>
                        </div>
                    </div>

                    <div class="flex gap-2">
                        <input v-model="postalCode" maxlength="10" placeholder="Enter postal code"
                            class="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black" />
                        <button type="button" class="rounded-full border border-gray-300 px-4 text-sm font-semibold hover:border-black">
                            Check
                        </button>
                    </div>

                    <div class="grid gap-3 text-sm sm:grid-cols-2">
                        <div class="rounded-md bg-gray-50 p-3">
                            <p class="font-semibold">Ship to you</p>
                            <p class="mt-1 text-gray-600">{{ selectedSize ? 'Ready after size selection' : 'Select a size for exact availability' }}</p>
                        </div>
                        <div class="rounded-md bg-gray-50 p-3">
                            <p class="font-semibold">Free pickup</p>
                            <p class="mt-1 text-gray-600">{{ selectedSizeStock > 0 ? 'Available at selected stores' : 'Check another size or color' }}</p>
                        </div>
                    </div>
                </div>

                <button type="button" @click="askAssistant"
                    class="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 py-4 font-semibold hover:border-black">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h8M8 14h5m8-2a9 9 0 11-4.21-7.62L21 4l-.92 4.09A8.96 8.96 0 0121 12z" />
                    </svg>
                    Ask Store Assistant
                </button>

                <!-- Product Details -->
                <div class="pt-4 space-y-3 text-sm border-t">
                    <div v-if="currentColor?.origin" class="flex items-center gap-2">
                        <span class="text-gray-900 font-bold">Origin:</span>
                        <span class="font-medium">{{ currentColor.origin }}</span>
                    </div>
                    <div v-if="selectedColorName" class="flex items-center gap-2">
                        <span class="text-gray-900 font-bold">Color shown:</span>
                        <span class="font-medium">{{ selectedColorName }}</span>
                    </div>
                    <div v-if="currentColor?.styleCode" class="flex items-center gap-2">
                        <span class="text-gray-900 font-bold">Style code:</span>
                        <span class="font-medium">{{ currentColor.styleCode }}</span>
                    </div>
                    <div v-if="currentCollection" class="flex items-center gap-2">
                        <span class="text-gray-900 font-bold">Collection:</span>
                        <span class="font-medium">{{ currentCollection }}</span>
                    </div>
                    <p v-if="materialNoteText" class="text-gray-700 pt-2">
                        {{ materialNoteText }}
                    </p>
                </div>

                <!-- Description -->
                <div v-if="currentColor?.description" class="pt-4 border-t">
                    <p class="text-gray-700 leading-relaxed">
                        {{ currentColor.description }}
                    </p>
                </div>

                <!-- Rating -->
                <div v-if="currentColor?.rating" class="flex items-center gap-2 pt-2">
                    <div class="flex text-lg">
                        <span v-for="n in 5" :key="n"
                            :class="n <= Math.round(currentColor.rating) ? 'text-yellow-400' : 'text-gray-300'">
                            ★
                        </span>
                    </div>
                    <span class="text-sm text-gray-600">
                        {{ currentColor.rating }} ({{ currentColor.reviewCount }} reviews)
                    </span>
                </div>

                <div class="divide-y divide-gray-200 border-t border-b">
                    <div v-for="item in productAccordions" :key="item.key">
                        <button type="button" @click="toggleAccordion(item.key)"
                            class="flex w-full items-center justify-between py-5 text-left font-semibold">
                            <span>{{ item.title }}</span>
                            <span class="text-xl leading-none">{{ openAccordions.includes(item.key) ? '-' : '+' }}</span>
                        </button>
                        <div v-if="openAccordions.includes(item.key)" class="pb-5 text-sm leading-6 text-gray-600">
                            <p v-for="line in item.lines" :key="line">{{ line }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <section class="mt-12 border-t pt-8">
            <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 class="text-2xl font-bold">Reviews</h2>
                    <p class="text-sm text-gray-500" v-if="reviewSummary.total">
                        {{ reviewSummary.average }} out of 5 from {{ reviewSummary.total }} reviews
                    </p>
                    <p class="text-sm text-gray-500" v-else>No reviews yet.</p>
                </div>
            </div>

            <div v-if="reviews.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="review in reviews" :key="review._id" class="border rounded-lg p-4">
                    <div class="flex items-center justify-between">
                        <p class="font-semibold">{{ review.username }}</p>
                        <div class="text-yellow-400">
                            <span v-for="n in 5" :key="n" :class="n <= review.rating ? 'text-yellow-400' : 'text-gray-300'">★</span>
                        </div>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">{{ review.colorName }} · Size {{ review.size }}</p>
                    <p class="text-sm text-gray-700 mt-3">{{ review.comment || 'No comment.' }}</p>
                </div>
            </div>
        </section>

        <section v-if="product" class="mt-12 border-t pt-8">
            <div class="mb-5 flex items-center justify-between">
                <h2 class="text-2xl font-bold">You Might Also Like</h2>
                <button type="button" @click="$router.push({ path: '/products', query: { productType: currentProductType || undefined, category: currentCategory || undefined } })"
                    class="text-sm font-semibold underline">
                    Shop similar
                </button>
            </div>

            <div v-if="relatedProducts.length" class="flex gap-4 overflow-x-auto pb-4">
                <button v-for="item in relatedProducts" :key="item.productId" type="button" @click="goToRelatedProduct(item)"
                    class="w-56 shrink-0 text-left">
                    <div class="mb-3 flex aspect-square items-center justify-center rounded-md bg-gray-100">
                        <img :src="item.thumbnail" :alt="item.name" class="h-full w-full object-contain" />
                    </div>
                    <p class="font-semibold">{{ item.name }}</p>
                    <p class="text-sm text-gray-500">{{ productTypeLabel(item.productType) }}</p>
                    <p class="mt-1 font-semibold">{{ formatPrice(item.price) }}</p>
                </button>
            </div>

            <div v-else class="flex flex-wrap gap-3">
                <button type="button" @click="$router.push({ path: '/products', query: { category: currentCategory || undefined } })"
                    class="rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold hover:border-black">
                    More {{ currentCategory || 'products' }}
                </button>
                <button type="button" @click="$router.push({ path: '/products', query: { productType: currentProductType || undefined } })"
                    class="rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold hover:border-black">
                    More {{ productTypeLabel(currentProductType) }}
                </button>
            </div>
        </section>
    </div>

    <div v-else class="text-center py-20 text-gray-400">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p class="mt-4">Loading...</p>
    </div>

    <!-- Success Toast -->
    <div v-if="showToast"
        class="fixed bottom-4 left-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-green-600 px-4 py-4 text-white shadow-lg animate-slide-up sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-md sm:px-6">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <div>
            <p class="font-semibold">{{ toastTitle }}</p>
            <p class="text-sm opacity-90">{{ toastMessage }}</p>
        </div>
        <button v-if="toastTitle === 'Added to bag!'" @click="goToBag" class="ml-4 underline text-sm hover:text-gray-200">
            View Bag
        </button>
    </div>

    <div v-if="showSizeGuide" class="fixed inset-0 z-[60] flex items-end bg-black/40 sm:items-center sm:justify-center">
        <div class="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:max-w-xl sm:rounded-2xl">
            <div class="mb-5 flex items-center justify-between">
                <h2 class="text-2xl font-bold">Size Guide</h2>
                <button type="button" @click="showSizeGuide = false" class="rounded-full p-2 hover:bg-gray-100" aria-label="Close size guide">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="overflow-hidden rounded-lg border border-gray-200">
                <table class="w-full text-left text-sm">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="px-4 py-3">US</th>
                            <th class="px-4 py-3">EU</th>
                            <th class="px-4 py-3">Foot Length</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        <tr v-for="row in sizeGuideRows" :key="row.eu">
                            <td class="px-4 py-3">{{ row.us }}</td>
                            <td class="px-4 py-3">{{ row.eu }}</td>
                            <td class="px-4 py-3">{{ row.cm }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p class="mt-4 text-sm text-gray-500">Fit can vary by model. If you are between sizes, consider the larger size for running shoes.</p>
        </div>
    </div>
</template>

<script>
import axios from "axios";
import { addToBag as addToBagHelper } from '../../utils/bagHelper'
import { API_BASE } from '../../utils/apiBase'
import { productSubtitle, productTypeLabel } from '../../utils/productMeta'
import { emitWishlistUpdated } from '../../utils/wishlist'
export default {
    data() {
        return {
            product: null,
            selectedImgIndex: 0,
            selectedColorIndex: 0,
            selectedSize: null,
            showToast: false,
            toastTitle: 'Added to bag!',
            toastMessage: '',
            reviews: [],
            relatedProducts: [],
            wishlistItems: [],
            wishlistSaving: false,
            postalCode: '',
            showSizeGuide: false,
            mediaLoaded: {},
            openAccordions: ['details'],
            sizeGuideRows: [
                { us: 'M 5 / W 6.5', eu: '37.5', cm: '23.5 cm' },
                { us: 'M 6 / W 7.5', eu: '38.5', cm: '24 cm' },
                { us: 'M 7 / W 8.5', eu: '40', cm: '25 cm' },
                { us: 'M 8 / W 9.5', eu: '41', cm: '26 cm' },
                { us: 'M 9 / W 10.5', eu: '42.5', cm: '27 cm' },
                { us: 'M 10 / W 11.5', eu: '44', cm: '28 cm' },
                { us: 'M 11 / W 12.5', eu: '45', cm: '29 cm' },
            ],
            reviewSummary: {
                total: 0,
                average: 0,
            },
        };
    },

    computed: {
        currentColor() {
            return this.product?.colors?.[this.selectedColorIndex] || null;
        },

        productName() {
            return this.product?.name || 'Product detail';
        },

        currentCategory() {
            return this.currentColor?.category || this.product?.category || '';
        },

        currentProductType() {
            return this.currentColor?.productType || this.product?.productType || '';
        },

        currentCollection() {
            return this.currentColor?.collection || this.product?.collection || '';
        },

        productSubtitleText() {
            return productSubtitle(this.currentCategory, this.currentProductType);
        },

        productBadge() {
            if (this.currentCollection) return this.currentCollection;
            return this.currentProductType ? productTypeLabel(this.currentProductType) : '';
        },

        deliveryEstimate() {
            const start = new Date();
            const end = new Date();
            start.setDate(start.getDate() + 3);
            end.setDate(end.getDate() + 6);
            const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
            return `${formatter.format(start)} - ${formatter.format(end)}`;
        },

        productAccordions() {
            const details = [
                this.currentColor?.description || `${this.productName} is designed for everyday comfort and confident styling.`,
                this.materialNoteText || '',
                this.currentColor?.styleCode ? `Style: ${this.currentColor.styleCode}` : '',
                this.selectedColorName ? `Color shown: ${this.selectedColorName}` : '',
                this.currentColor?.origin ? `Origin: ${this.currentColor.origin}` : '',
            ].filter(Boolean);

            return [
                {
                    key: 'details',
                    title: 'Product Details',
                    lines: details,
                },
                {
                    key: 'shipping',
                    title: 'Shipping & Returns',
                    lines: [
                        'Free standard delivery is available for members.',
                        'You can return eligible items within 30 days after delivery.',
                        'Pickup availability depends on selected size, color, and store stock.',
                    ],
                },
                {
                    key: 'reviews',
                    title: `Reviews (${this.reviewSummary.total || this.currentColor?.reviewCount || 0})`,
                    lines: [
                        this.reviewSummary.total
                            ? `${this.reviewSummary.average} out of 5 from ${this.reviewSummary.total} verified reviews.`
                            : this.currentColor?.rating
                                ? `${this.currentColor.rating} out of 5 from ${this.currentColor.reviewCount || 0} product reviews.`
                                : 'No reviews yet.',
                    ],
                },
            ];
        },

        materialNoteText() {
            const note = this.currentColor?.materialNote;
            if (!note || note === '[object Object]') return '';
            if (typeof note === 'object') {
                return note.text || note.value || note.markdown || note.description || '';
            }
            return String(note);
        },

        currentImages() {
            return this.currentColor?.images?.length
                ? this.currentColor.images
                : [this.currentColor?.thumbnail].filter(Boolean);
        },

        currentSizes() {
            return this.currentColor?.sizes || [];
        },

        selectedSizeStock() {
            if (!this.selectedSize) return 0;
            return this.currentSizes.find(size => size.size === this.selectedSize)?.stock || 0;
        },

        lowStockSizes() {
            return this.currentSizes.filter(size => this.isLowStock(size));
        },

        stockNotice() {
            if (this.selectedSize && this.selectedSizeStock > 0 && this.selectedSizeStock <= 5) {
                return `Size ${this.selectedSize} is almost gone. Only ${this.selectedSizeStock} left.`;
            }

            if (!this.selectedSize && this.lowStockSizes.length > 0) {
                const preview = this.lowStockSizes
                    .slice(0, 3)
                    .map(size => `${size.size} (${size.stock} left)`)
                    .join(', ');
                const more = this.lowStockSizes.length > 3 ? ` and ${this.lowStockSizes.length - 3} more` : '';
                return `Low stock: ${preview}${more}.`;
            }

            return '';
        },

        selectedColorName() {
            return this.currentColor?.colorName || null;
        },

        currentWishlistItem() {
            return this.wishlistItems.find(item =>
                item.productId === this.product?.productId &&
                (item.colorName || '') === (this.selectedColorName || '') &&
                (item.size || '') === (this.selectedSize || '')
            ) || null;
        },

        isCurrentWishlistSaved() {
            return !!this.currentWishlistItem;
        },

        isColorAvailable() {
            return (color) => {
                return color?.sizes?.some(size => size.stock > 0) || false;
            };
        },

        isCurrentColorSoldOut() {
            if (!this.currentSizes.length) return true;
            return this.currentSizes.every(size => size.stock === 0);
        }
    },

    async mounted() {
        try {
            const id = this.$route.params.id;
            const res = await axios.get(`${API_BASE}/shoes/detail/${id}`);
            this.product = res.data;
            await this.fetchReviews();
            await this.fetchRelatedProducts();
            await this.fetchWishlistState();

            console.log('✅ Product loaded:', {
                id: this.product._id,
                productId: this.product.productId,
                colors: this.product.colors.length,
                currentColor: this.selectedColorName
            });

        } catch (error) {
            console.error('❌ Error loading product:', error);
        }
    },

    watch: {
        '$route.params.id': {
            async handler(id) {
                if (!id || !this.product) return;
                try {
                    this.product = null;
                    this.selectedImgIndex = 0;
                    this.selectedColorIndex = 0;
                    this.selectedSize = null;
                    this.relatedProducts = [];
                    const res = await axios.get(`${API_BASE}/shoes/detail/${id}`);
                    this.product = res.data;
                    await this.fetchReviews();
                    await this.fetchRelatedProducts();
                    await this.fetchWishlistState();
                } catch (error) {
                    console.error('Error loading product:', error);
                }
            },
        },
    },

    methods: {
        isVideo(url) {
            if (!url) return false;
            const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
            return videoExtensions.some(ext => url.toLowerCase().includes(ext));
        },

        isMediaLoading(url) {
            if (!url) return false;
            return !this.mediaLoaded[url];
        },

        markMediaLoaded(url) {
            if (!url || this.mediaLoaded[url]) return;
            this.mediaLoaded = {
                ...this.mediaLoaded,
                [url]: true,
            };
        },

        selectColor(index) {
            this.selectedColorIndex = index;
            this.selectedImgIndex = 0;
            this.selectedSize = null;

            console.log('Selected color:', {
                name: this.selectedColorName,
                available: this.isColorAvailable(this.currentColor),
                sizes: this.currentSizes
            });
        },

        selectSize(size) {
            this.selectedSize = size.size;
        },

        isLowStock(size) {
            return Number(size?.stock || 0) > 0 && Number(size.stock) <= 5;
        },

        productTypeLabel,

        toggleAccordion(key) {
            if (this.openAccordions.includes(key)) {
                this.openAccordions = this.openAccordions.filter(item => item !== key);
            } else {
                this.openAccordions = [...this.openAccordions, key];
            }
        },

        askAssistant() {
            window.dispatchEvent(new CustomEvent('openChatWidget', {
                detail: {
                    text: `Can you help me choose the right size and color for ${this.productName}?`,
                },
            }));
        },

        addToBag() {
            if (!this.selectedSize || !this.currentColor) return;

            const selectedSizeObj = this.currentSizes.find(s => s.size === this.selectedSize);

            const bagItem = {
                productId: this.product.productId,
                name: this.productName,
                styleCode: this.currentColor.styleCode,
                colorName: this.selectedColorName,
                size: this.selectedSize,
                price: this.currentColor.price || this.product.price || 0,
                quantity: 1,
                thumbnail: this.currentColor.thumbnail || this.currentImages[0],
                image: this.currentImages[this.selectedImgIndex] || this.currentColor.thumbnail,
                stock: selectedSizeObj.stock
            };

            // ✅ Dùng helper function
            addToBagHelper(bagItem);

            console.log('✅ Added to bag:', bagItem);

            this.showFeedback('Added to bag!', `${this.selectedColorName} - Size ${this.selectedSize}`);
        },

        async fetchReviews() {
            if (!this.product?.productId) return;

            try {
                const res = await axios.get(`${API_BASE}/reviews/product/${this.product.productId}`);
                this.reviews = res.data.reviews || [];
                this.reviewSummary = res.data.summary || { total: 0, average: 0 };
            } catch (error) {
                console.error('Failed to load reviews:', error);
            }
        },

        async fetchRelatedProducts() {
            if (!this.product) return;

            try {
                const res = await axios.get(`${API_BASE}/shoes`, { params: { sort: 'rating' } });
                const products = res.data || [];
                const sameType = products.filter(item =>
                    item.productId !== this.product.productId &&
                    item.productType === this.currentProductType &&
                    item.category === this.currentCategory
                );
                const sameCategory = products.filter(item =>
                    item.productId !== this.product.productId &&
                    item.category === this.currentCategory &&
                    !sameType.some(match => match.productId === item.productId)
                );

                const fallback = products.filter(item =>
                    item.productId !== this.product.productId &&
                    !sameType.some(match => match.productId === item.productId) &&
                    !sameCategory.some(match => match.productId === item.productId)
                );

                this.relatedProducts = [...sameType, ...sameCategory, ...fallback]
                    .slice(0, 8);
            } catch (error) {
                console.error('Failed to load related products:', error);
            }
        },

        goToRelatedProduct(item) {
            this.$router.push(`/shoes/${item.productId}`);
        },

        async fetchWishlistState() {
            const user = this.getCurrentUser();
            if (!user?._id || !this.product?.productId) {
                this.wishlistItems = [];
                return;
            }

            try {
                const res = await axios.get(`${API_BASE}/wishlist/user/${user._id}`);
                this.wishlistItems = res.data.items || [];
            } catch (error) {
                console.error('Failed to load wishlist state:', error);
                this.wishlistItems = [];
            }
        },

        async saveToWishlist(notifyOnRestock) {
            const user = this.getCurrentUser();
            if (!user) {
                this.$router.push('/login');
                return;
            }

            if (this.wishlistSaving) return;
            this.wishlistSaving = true;

            try {
                const existingItem = this.currentWishlistItem;
                if (existingItem && !notifyOnRestock) {
                    await axios.delete(`${API_BASE}/wishlist/${existingItem._id}`);
                    this.wishlistItems = this.wishlistItems.filter(item => item._id !== existingItem._id);
                    emitWishlistUpdated();
                    this.showFeedback('Removed from wishlist', this.productName);
                    return;
                }

                const response = await axios.post(`${API_BASE}/wishlist`, {
                    userId: user._id,
                    productId: this.product.productId,
                    colorName: this.selectedColorName || '',
                    size: this.selectedSize || '',
                    notifyOnRestock,
                });

                const savedItem = response.data.item;
                this.wishlistItems = [
                    savedItem,
                    ...this.wishlistItems.filter(item =>
                        !(
                            item.productId === savedItem.productId &&
                            (item.colorName || '') === (savedItem.colorName || '') &&
                            (item.size || '') === (savedItem.size || '')
                        )
                    ),
                ];
                emitWishlistUpdated();

                this.showFeedback(
                    notifyOnRestock ? 'Restock alert saved!' : 'Saved to wishlist!',
                    notifyOnRestock
                        ? `${this.selectedColorName} - Size ${this.selectedSize}`
                        : this.productName
                );
            } catch (error) {
                console.error('Failed to save wishlist:', error);
                alert(error.response?.data?.message || 'Failed to save wishlist');
            } finally {
                this.wishlistSaving = false;
            }
        },

        showFeedback(title, message) {
            this.toastTitle = title;
            this.toastMessage = message;
            this.showToast = true;
            setTimeout(() => {
                this.showToast = false;
            }, 5000);
        },

        getCurrentUser() {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        },


        goToBag() {
            this.$router.push('/bag');
        },

        formatPrice(v) {
            return new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
            })
                .format(v)
                .replace("₫", "đ");
        },
    },
};
</script>

<style src="./ShoesDetail.css" scoped>
@keyframes slide-up {
    from {
        transform: translateY(100%);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.animate-slide-up {
    animation: slide-up 0.3s ease-out;
}
</style>
