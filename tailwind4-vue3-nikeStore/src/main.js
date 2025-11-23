import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router/index'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

createApp(App).use(router).mount('#app')
