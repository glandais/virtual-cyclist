import ui from '@nuxt/ui/vue-plugin';
import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from '~/App.vue';
import '~/assets/main.css';

const app = createApp(App);

// Nuxt UI requires a router instance even though the demo is a single page.
const router = createRouter({
    history: createWebHashHistory(),
    routes: [{ path: '/', component: { render: () => null } }],
});

app.use(router);
app.use(ui);

app.mount('#app');
