const preprocess = require('svelte-preprocess');
const { compilerOptions } = require('./tsconfig.json');
const path = require('path');

const mode = process.env.NODE_ENV || 'development';
const preprocessorOptions = {
    scss: {
        renderSync: true,
    },
    typescript: {
        compilerOptions,
        tsconfigFile: './tsconfig.json',
    },
};

module.exports = {
    devServer: {
        hot: true,
    },
    devtool: 'eval-source-map',
    entry: {
        'build/bundle': ['./src/main.js'],
    },
    mode,
    module: {
        rules: [
            {
                test: /\.(svelte)$/,
                use: [
                    {
                        loader: 'svelte-loader',
                        options: {
                            preprocess: [
                                preprocess(preprocessorOptions),
                            ],
                        },
                    },
                ],
            },
            {
                // required to prevent errors from Svelte on Webpack 5+
                resolve: {
                    fullySpecified: false,
                },
                test: /node_modules\/svelte\/.*\.mjs$/,
            },
        ],
    },
    output: {
        chunkFilename: '[name].[id].js',
        filename: '[name].js',
        path: path.join(__dirname, '/public'),
    },
    resolve: {
        alias: {
            svelte: path.dirname(require.resolve('svelte/package.json')),
        },
        extensions: [
            '.ts',
            '.mjs',
            '.js',
            '.svelte',
            '.html',
        ],
        mainFields: [
            'svelte',
            'module',
            'browser',
            'main',
        ],
    },
};
