import { createApp } from 'vue'
import { createVfm } from '@lrochefort/vue-final-modal'
import '@lrochefort/vue-final-modal/style.css'
import './style.css'
import App from './App.vue'

createApp(App).use(createVfm()).mount('#app')
