// This module is registered as a transform hook of `style-loader`.
// It fixes relative paths in CSS using a dynamically determined base path.

module.exports = function (css) {
    var publicPath = __webpack_public_path__;

    return css.replace(
        /url\(\.\/([^)]+)\)/g,
        function (_, path) {
            return 'url("' + publicPath + path + '")';
        },
    );
};
