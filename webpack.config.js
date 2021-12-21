const preprocess = require('svelte-preprocess');
const { compilerOptions } = require('./tsconfig.json');
const path = require('path');

const mode = process.env.NODE_ENV || 'development';
const preprocessorOptions = {
    scss: {
        renderSync: true,
    },
    sourceMap: enableSourceMaps,
    typescript: {
        compilerOptions,
        tsconfigFile: './tsconfig.json',
    },
};

module.exports = {
    devServer: {
        hot: true
    },
    devtool: 'eval-source-map',
    entry: 'build/bundle': ['./src/main.js'],
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
				test: /node_modules\/svelte\/.*\.mjs$/,
				resolve: {
					fullySpecified: false
				}
			}
        ],
    },
    output: {
        path: path.join(__dirname, '/public'),
		filename: '[name].js',
		chunkFilename: '[name].[id].js'
    },
    resolve: {
        alias: {
			svelte: path.dirname(require.resolve('svelte/package.json'))
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
        ]
    },
};
