import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Dashboard from './pages/Dashboard.vue'
import './styles/tokens.css'
import './styles/base.css'
createApp(Dashboard).use(createPinia()).mount('#app')
