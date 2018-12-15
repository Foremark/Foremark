const path = require('path');

const webpack = require('webpack');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const gitRevision = new GitRevisionPlugin();

module.exports = (debug, selfContained) => ({
  entry: {
    markfront: './app/browser.tsx',
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
          selfContained ? {
            loader: 'style-loader'
          } : {
            loader: MiniCssExtractPlugin.loader,
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
          }
        ],
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
      }
    ]
  },
  resolve: {
    extensions: [
      '.tsx', '.ts', '.js', '.glsl', '.less', '.png',
      '.woff', '.svg', '.woff2', '.otf', '.ttf', '.eot',
      '.wasm',
    ]
  },
  output: {
    filename: selfContained ? 'markfront.bundle.js' : 'markfront.js',
    chunkFilename: 'markfront-[name].js',
    path: path.resolve(__dirname, 'browser'),
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'VERSION': JSON.stringify(gitRevision.version()),
        'COMMITHASH': JSON.stringify(gitRevision.commithash()),
        'BRANCH': JSON.stringify(gitRevision.branch()),
        'IS_BROWSER': JSON.stringify(true),
        'INJECT_CSS': JSON.stringify(!selfContained),
        'LAZY_LOADING': JSON.stringify(!selfContained),
      },
    }),
    new MiniCssExtractPlugin({
      chunkFilename: 'markfront-[name].css',
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
