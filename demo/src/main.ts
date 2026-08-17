import ui from '@nuxt/ui/vue-plugin';
import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from '~/App.vue';
import '~/assets/main.css';

const app = createApp(App);

// TEMPORARY: components not migrated to Nuxt UI yet still need the PrimeVue
// config injection -- without it they throw on `$primevue.config`. Removed in
// the final purge commit, once no PrimeVue component is left.
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: { prefix: 'p', darkModeSelector: '.dark', cssLayer: false },
    },
    ripple: true,
});

// Nuxt UI requires a router instance even though the demo is a single page.
const router = createRouter({
    history: createWebHashHistory(),
    routes: [{ path: '/', component: { render: () => null } }],
});

app.use(router);
app.use(ui);

app.mount('#app');
