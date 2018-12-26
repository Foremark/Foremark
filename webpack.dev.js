/*
 * This webpack configuration generates a small bundle file (`foremark.js`)
 * along with several external asset files.
 */
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common(true, false), {
  devtool: 'inline-source-map',
  mode: 'development',
  devServer: {
    contentBase: '.',
    publicPath: '/browser/',
    historyApiFallback: true,
    inline: false,
    openPage: 'examples/basic.mf.xhtml',
  }
});
