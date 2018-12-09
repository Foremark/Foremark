const path = require('path');

const webpack = require('webpack');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const gitRevision = new GitRevisionPlugin();

module.exports = debug => ({
  entry: {
    markfront: './app/index.tsx',
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
        use: [{
          loader: MiniCssExtractPlugin.loader,
        }, {
          loader: 'css-loader',
          options: {
            modules: true,
          },
        }, {
          loader: 'less-loader',
          options: {
            strictMath: true,
            strictUnits: true,
            noIeCompat: true,
          },
        }],
      },
      {
        test: /\.(svg|eot|ttf|woff|woff2|png|jpg)$/,
        loader: 'url-loader',
        options: {
          limit: 8000,
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
    ]
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'VERSION': JSON.stringify(gitRevision.version()),
        'COMMITHASH': JSON.stringify(gitRevision.commithash()),
        'BRANCH': JSON.stringify(gitRevision.branch()),
        'IS_BROWSER': JSON.stringify(true),
      },
    }),
    new MiniCssExtractPlugin(),
  ],
});
