<script setup>
const features = [
  {
    title: "Nike Killshot",
    subtitle: "Courtside Attitude with a Modern Touch",
    img: "/public/assets/img/nike-just-do-it.jpg",
  },
  {
    title: "Nike United",
    subtitle: "Wicked Game",
    img: "/public/assets/img/nike-just-do-it-2.jpg",
  },
  {
    title: "Jordan",
    subtitle: "New Season, Same Energy",
    img: "/public/assets/img/nike-just-do-it-3.jpg",
  },
  {
    title: "Nike Sportswear",
    subtitle: "Winter Essentials",
    img: "/public/assets/img/nike-just-do-it-4.jpg",
  },
];
</script>

<template>
  <section class="w-full bg-white">
    <div class="max-w-7xl mx-auto px-4">
      <h2 class="text-2xl font-bold mb-10">Featured</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="(item, index) in features"
          :key="index"
          class="relative group overflow-hidden "
        >
          <img
            :src="item.img"
            :alt="item.title"
            class="w-full h-[350px] object-cover transform group-hover:scale-105 transition duration-700"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent p-6 flex flex-col justify-end text-white"
          >
            <h3 class="text-lg font-semibold">{{ item.title }}</h3>
            <p class="text-sm text-gray-200">{{ item.subtitle }}</p>
            <button
              class="mt-3 bg-white text-black font-semibold px-4 py-1.5 rounded-full w-fit hover:bg-gray-200 transition"
            >
              Shop
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
