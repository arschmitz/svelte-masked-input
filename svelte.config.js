const preprocess = require('svelte-preprocess');

const preprocessorOptions = {
    scss: {
        renderSync: true,
    },
    typescript: {
        compilerOptions: {
            allowUmdGlobalAccess: true,
            skipLibCheck: true,
        },
    },
};

module.exports = {
    preprocess: preprocess(preprocessorOptions),
    preprocessorOptions,
};
