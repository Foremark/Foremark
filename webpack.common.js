const path = require('path');

const webpack = require('webpack');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
const gitRevision = new GitRevisionPlugin();
const LicenseWebpackPlugin = require('license-webpack-plugin').LicenseWebpackPlugin;

module.exports = (debug, selfContained) => ({
  entry: {
    foremark: './app/browser-stage0.ts',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.less$/,
        use: [
          {
            loader: 'style-loader',
            options: {
              transform: 'app/view/transform-css.js',
            },
          },
          {
            loader: 'css-loader',
            options: {
              modules: true,
            },
          },
          {
            loader: 'less-loader',
            options: {
              strictMath: true,
              strictUnits: true,
              noIeCompat: true,
            },
          },
          // Exclude WOFF2 from the self-contained bundle to optimize the size.
          selfContained && {
            loader: 'string-replace-loader',
            options: {
              search: "url\\([^()]+\\)\\s*format\\('woff2'\\),\\s*",
              replace: '',
              flags: 'g',
            },
          }
        ].filter(x => x),
      },
      {
        test: /\.(eot|ttf|woff|woff2)$/,
        loader: selfContained ? 'url-loader' : 'file-loader',
        options: {
          name: 'assets/[name].[ext]',
          publicPath: '.',
        },
      },
      {
        test: /\.(svg|png|jpg)$/,
        loader: 'url-loader',
        options: {
          limit: selfContained ? 1e6 : 8000,
          name: 'assets/[name].[ext]',
          publicPath: '.',
        },
      },
      selfContained && {
        test: /\.wasm$/,
        loader: 'wasm-fake-sync-loader',
        type: 'javascript/auto',
        options: {},
      }
    ].filter(x => x),
  },
  resolve: {
    extensions: [
      '.tsx', '.ts', '.js', '.glsl', '.less', '.png',
      '.woff', '.svg', '.woff2', '.otf', '.ttf', '.eot',
      '.wasm',
    ]
  },
  resolveLoader: {
    alias: {
      'wasm-fake-sync-loader': path.resolve(__dirname, 'tools/wasm-fake-sync-loader.js'),
    },
  },
  output: {
    filename: selfContained ? 'foremark.bundle.js' : 'foremark.js',
    chunkFilename: 'foremark-[name].js',
    path: path.resolve(__dirname, 'browser'),
  },
  plugins: [
    new LicenseWebpackPlugin({
      perChunkOutput: false,
      addBanner: true,
    }),
    new webpack.DefinePlugin({
      'process.env': {
        'VERSION': JSON.stringify(gitRevision.version()),
        'COMMITHASH': JSON.stringify(gitRevision.commithash()),
        'BRANCH': JSON.stringify(gitRevision.branch()),
        'IS_BROWSER': JSON.stringify(true),
        'LAZY_LOADING': JSON.stringify(!selfContained),
      },
    }),
  ],
  optimization: {
    splitChunks: {
      // Disable `SplitChunksPlugin` since there aren't much code shared among
      // lazy loaded modules (for now).
      chunks: () => false,
    },
  },
});
