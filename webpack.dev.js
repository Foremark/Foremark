/*
 * This webpack configuration generates a small bundle file (`markfront.js`)
 * along with several external asset files.
 */
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common(true, false), {
  devtool: 'inline-source-map',
  mode: 'development',
  devServer: {
    contentBase: './examples',
    publicPath: '/dist/',
    historyApiFallback: true,
    inline: false,
    openPage: 'basic.mf.xhtml',
  }
});
