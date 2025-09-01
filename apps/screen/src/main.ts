import { createApp } from 'vue'
import { createPinia } from 'pinia'
import DataVVue3 from '@kjgl77/datav-vue3'
import App from './App.vue'
import './styles/tokens.css'
import './styles/base.css'

createApp(App).use(createPinia()).use(DataVVue3).mount('#app')
