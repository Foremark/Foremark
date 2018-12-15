const webpack = require('webpack');
const merge = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');
const common = require('./webpack.common.js');

module.exports = merge(common(false, false), {
  devtool: 'source-map',
  mode: 'production',
  optimization: {
    minimizer: [new TerserPlugin({
      sourceMap: true,
    })],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      },
    }),
  ],
});
