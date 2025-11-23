<script setup>
import Slide from './slide/Slide.vue'
import Header from '../header/Header.vue'
import Feature from './featured/Feature.vue';
import ColorOfSeason from './colorOfSeason/ColorOfSeason.vue';
import ShopBySport from './shopBySport/ShopBySport.vue';
import Footer from '../footer/Footer.vue';
import AllShoes from './allShoes/AllShoes.vue';

</script>

<template>
  <div class="home">
    <Slide />
    <Feature />   
    <AllShoes />
    <ColorOfSeason />
    <ShopBySport />
    <Footer />
  </div>
</template>
