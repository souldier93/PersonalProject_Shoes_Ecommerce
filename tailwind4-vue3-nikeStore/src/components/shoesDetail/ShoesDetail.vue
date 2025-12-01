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
                <div class="text-orange-600 text-sm font-semibold -mb-1">
                    Recycled Materials
                </div>

                <div class="space-y-2">
                    <h1 class="text-2xl font-bold">{{ productName }}</h1>
                    <p class="text-gray-600 text-sm">{{ currentColor?.category || 'Men\'s Shoes' }}</p>
                    <p v-if="currentColor?.price" class="text-2xl font-bold">
                        {{ formatPrice(currentColor.price) }}
                    </p>
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
                            :disabled="size.stock === 0"
                            class="border rounded-md py-3 px-2 text-sm font-medium relative transition-all text-center"
                            :class="[
                                selectedSize === size.size
                                    ? 'border-black bg-gray-50'
                                    : size.stock === 0
                                        ? 'opacity-40 border-gray-200 cursor-not-allowed line-through'
                                        : 'hover:border-black border-gray-300'
                            ]">
                            {{ size.size }}
                        </button>
                    </div>
                </div>

                <!-- Add to Bag Button -->
                <button @click="addToBag" :disabled="!selectedSize || isCurrentColorSoldOut"
                    class="py-4 w-full rounded-full font-semibold transition-all text-base" :class="selectedSize && !isCurrentColorSoldOut
                        ? 'bg-black text-white hover:bg-gray-800 active:scale-95'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'">
                    {{ isCurrentColorSoldOut ? 'Sold Out' : (selectedSize ? 'Add to Bag' : 'Select a size') }}
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
            <p class="font-semibold">Added to bag!</p>
            <p class="text-sm opacity-90">{{ selectedColorName }} - Size {{ selectedSize }}</p>
        </div>
        <button @click="goToBag" class="ml-4 underline text-sm hover:text-gray-200">
            View Bag
        </button>
    </div>
</template>

<script>
import axios from "axios";
import { addToBag as addToBagHelper } from '../../utils/bagHelper'
export default {
    data() {
        return {
            product: null,
            selectedImgIndex: 0,
            selectedColorIndex: 0,
            selectedSize: null,
            showToast: false,
        };
    },

    computed: {
        currentColor() {
            return this.product?.colors?.[this.selectedColorIndex] || null;
        },

        productName() {
            return this.product?.name || `Nike Pegasus Trail 5 - ${this.product?.productId || ''}`;
        },

        currentImages() {
            return this.currentColor?.images || [];
        },

        currentSizes() {
            return this.currentColor?.sizes || [];
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
            const res = await axios.get(`http://localhost:3000/shoes/detail/${id}`);
            this.product = res.data;

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
            if (size.stock > 0) {
                this.selectedSize = size.size;
            }
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

            this.showToast = true;
            setTimeout(() => {
                this.showToast = false;
            }, 5000);
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
