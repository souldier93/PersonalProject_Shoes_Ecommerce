<template>
    <div v-if="product" class="max-w-6xl mx-auto px-8 justify-center">
        <div class="flex gap-6">
            <!-- LEFT - Thumbnails -->
            <div class="flex flex-col items-start">
                <div class="flex flex-col gap-3 max-h-[680px] overflow-y-auto scrollbar-hide">
                    <div v-for="(img, i) in currentImages" :key="i"
                        class="aspect-square w-16 bg-gray-100 rounded-md flex items-center justify-center cursor-pointer border-2 transition-all hover:border-gray-400"
                        :class="selectedImgIndex === i ? 'border-black' : 'border-transparent'"
                        @click="selectedImgIndex = i">

                        <!-- Video Thumbnail -->
                        <video v-if="isVideo(img)" :src="img" class="w-full h-full object-contain" muted
                            preload="metadata">
                        </video>

                        <!-- Image Thumbnail -->
                        <img v-else :src="img" class="w-full h-full object-contain" />
                    </div>
                </div>
            </div>

            <!-- CENTER - Main Image/Video -->
            <div class="flex items-start">
                <div class="max-w-full max-h-full bg-[#f5f5f5] rounded-lg inline-flex">
                    <!-- Video Player -->
                    <video v-if="isVideo(currentImages[selectedImgIndex])" :src="currentImages[selectedImgIndex]"
                        class="max-w-[680px] max-h-[680px] object-contain rounded-lg" controls autoplay muted loop
                        playsinline>
                        Your browser does not support the video tag.
                    </video>

                    <!-- Image Display -->
                    <img v-else-if="currentImages[selectedImgIndex]" :src="currentImages[selectedImgIndex]"
                        class="max-w-[680px] max-h-[680px] object-contain" />
                </div>
            </div>

            <!-- RIGHT - Product Info -->
            <div class="w-1/3 space-y-6">
                <div v-if="productBadge" class="text-orange-600 text-sm font-semibold -mb-1">
                    {{ productBadge }}
                </div>

                <div class="space-y-2">
                    <h1 class="text-2xl font-bold">{{ productName }}</h1>
                    <p class="text-gray-600 text-sm">{{ productSubtitleText }}</p>
                    <p v-if="currentColor?.price" class="text-2xl font-bold">
                        {{ formatPrice(currentColor.price) }}
                    </p>
                    <button @click="saveToWishlist(false)"
                        class="mt-3 w-full border border-gray-300 rounded-full py-3 font-semibold hover:border-black transition">
                        Save to Wishlist
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
                        <button class="text-sm text-gray-600 hover:text-black flex items-center gap-1">
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
                    <div v-else-if="currentSizes.length > 0" class="grid grid-cols-3 gap-2">
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
                    <p v-if="currentColor?.materialNote" class="text-gray-700 pt-2">
                        {{ currentColor.materialNote }}
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
            </div>
        </div>

        <section class="mt-12 border-t pt-8">
            <div class="flex items-end justify-between mb-6">
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
    </div>

    <div v-else class="text-center py-20 text-gray-400">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p class="mt-4">Loading...</p>
    </div>

    <!-- Success Toast -->
    <div v-if="showToast"
        class="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-slide-up">
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
</template>

<script>
import axios from "axios";
import { addToBag as addToBagHelper } from '../../utils/bagHelper'
import { API_BASE } from '../../utils/apiBase'
import { productSubtitle, productTypeLabel } from '../../utils/productMeta'
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

    methods: {
        isVideo(url) {
            if (!url) return false;
            const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
            return videoExtensions.some(ext => url.toLowerCase().includes(ext));
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

        async saveToWishlist(notifyOnRestock) {
            const user = this.getCurrentUser();
            if (!user) {
                this.$router.push('/login');
                return;
            }

            try {
                await axios.post(`${API_BASE}/wishlist`, {
                    userId: user._id,
                    productId: this.product.productId,
                    colorName: this.selectedColorName || '',
                    size: this.selectedSize || '',
                    notifyOnRestock,
                });

                this.showFeedback(
                    notifyOnRestock ? 'Restock alert saved!' : 'Saved to wishlist!',
                    notifyOnRestock
                        ? `${this.selectedColorName} - Size ${this.selectedSize}`
                        : this.productName
                );
            } catch (error) {
                console.error('Failed to save wishlist:', error);
                alert(error.response?.data?.message || 'Failed to save wishlist');
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
