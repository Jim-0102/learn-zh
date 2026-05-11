import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}

const app = createApp(App)

app.use(router)

app.mount('#app')
