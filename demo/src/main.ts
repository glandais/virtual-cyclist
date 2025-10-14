import Aura from '@primevue/themes/aura';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import { createApp } from 'vue';
import App from '~/App.vue';
import '~/assets/main.css';

const app = createApp(App);

// Register PrimeVue with Aura theme
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            prefix: 'p',
            darkModeSelector: '.dark',
            cssLayer: false,
        },
    },
    ripple: true,
});

// Register Toast service
app.use(ToastService);

app.mount('#app');
