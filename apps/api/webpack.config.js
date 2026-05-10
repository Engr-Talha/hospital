const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  resolve: {
    alias: {
      // Webpack does not read tsconfig paths; keep in sync with tsconfig.base.json
      '@hospital/shared': join(__dirname, '../../libs/shared/src/index.ts'),
    },
  },
  output: {
    path: join(__dirname, '../../dist/apps/api'),
    clean: true,
    ...(!isProd && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMap: !isProd,
    }),
  ],
};
