const binding = require('../wasm/diagram');
const wasmModule = require('../wasm/diagram_bg');

module.exports = binding;

if (wasmModule.__wasm_ready__) {
    // The WebAssembly module was imported using `wasm-fake-sync-loader`.
    // Though the exports seem accessible, they are actually inaccessible
    // until the module is instantiated.
    module.exports.promise = wasmModule.__wasm_ready__
        .then(function () { return binding; });
} else {
    // If the WebAsesmbly module was processed by Webpack normally, then
    // we can access the exports immediately.
    module.exports.promise = Promise.resolve(binding);
}
