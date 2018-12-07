const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common(true), {
  devtool: 'inline-source-map',
  mode: 'development',
  devServer: {
    contentBase: './examples',
    historyApiFallback: true,
    inline: false,
    openPage: 'basic.mf.xml',
  }
});
