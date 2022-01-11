import App from './App.svelte';

const app = new App({
    props: {
        name: 'Svelte Masked Input',
    },
    target: document.body,
});

export default app;
