<script setup>
import { defineAsyncComponent, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Slide from './slide/Slide.vue'
import DeferredSection from './DeferredSection.vue'
import { hasProductScrollRestoreForRoute } from '../../utils/productScrollRestore'

const Feature = defineAsyncComponent(() => import('./featured/Feature.vue'))
const AllShoes = defineAsyncComponent(() => import('./allShoes/AllShoes.vue'))
const ColorOfSeason = defineAsyncComponent(() => import('./colorOfSeason/ColorOfSeason.vue'))
const ShopBySport = defineAsyncComponent(() => import('./shopBySport/ShopBySport.vue'))
const Footer = defineAsyncComponent(() => import('../footer/Footer.vue'))

const route = useRoute()
const hasPendingProductScrollRestore = ref(false)

onMounted(() => {
  hasPendingProductScrollRestore.value = hasProductScrollRestoreForRoute(route.fullPath)
})
</script>

<template>
  <div class="home">
    <Slide />
    <DeferredSection min-height="720px" :eager="hasPendingProductScrollRestore">
      <Feature />
    </DeferredSection>
    <DeferredSection data-testid="catalog-section" min-height="900px" :eager="hasPendingProductScrollRestore">
      <AllShoes />
    </DeferredSection>
    <DeferredSection min-height="520px">
      <ColorOfSeason />
    </DeferredSection>
    <DeferredSection min-height="520px">
      <ShopBySport />
    </DeferredSection>
    <DeferredSection min-height="240px">
      <Footer />
    </DeferredSection>
  </div>
</template>
