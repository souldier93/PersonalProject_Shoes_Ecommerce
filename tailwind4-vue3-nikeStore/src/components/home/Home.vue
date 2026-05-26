<script setup>
import { defineAsyncComponent } from 'vue'
import Slide from './slide/Slide.vue'
import DeferredSection from './DeferredSection.vue'

const Feature = defineAsyncComponent(() => import('./featured/Feature.vue'))
const AllShoes = defineAsyncComponent(() => import('./allShoes/AllShoes.vue'))
const ColorOfSeason = defineAsyncComponent(() => import('./colorOfSeason/ColorOfSeason.vue'))
const ShopBySport = defineAsyncComponent(() => import('./shopBySport/ShopBySport.vue'))
const Footer = defineAsyncComponent(() => import('../footer/Footer.vue'))
</script>

<template>
  <div class="home">
    <Slide />
    <DeferredSection min-height="720px">
      <Feature />
    </DeferredSection>
    <DeferredSection min-height="900px">
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
