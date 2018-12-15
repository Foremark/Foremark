// A webpack loader for WebAssembly modules.
//
// This loader is different from webpack's standard wasm handling in several ways:
//
//  - `*.wasm` files are inlined.
//
//  - The generated module can be included in a main chunk.
//
//  - The WebAssembly module is still instantated asynchronously, so until that
//    accessing module exports results in a runtime error.
//    A special export `__wasm_ready__` of type `Promise` can be used to wait
//    until the module is ready:
//
//    ```
//    export * from 'exports-of-wasm-module';
//    export const __wasm_ready__: Promise<void>;
//    ```
//
const describeWasm = require('describe-wasm').default;

module.exports = function (src) {
    const url = JSON.stringify(
        `data:application/wasm;base64,${src.toString('base64')}`
    );

    // Generate trampolines for all exports
    const wasmInfo = describeWasm(src);

    const trampolines = wasmInfo.exports.map(exp => {
        const {name} = exp;
        return `Object.defineProperty(module.exports, '${name}', ` +
            `{ get: function () { return ensureExports().${name}; } });`;
    });

    return `
        let wasmExports = null;

        const response = fetch(${url});
        let promise;
        let importObject;

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            promise = WebAssembly.instantiateStreaming(response, importObject);
        } else {
            promise = response
                .then(function (x) { return x.arrayBuffer(); })
                .then(function (bytes) {
                    return WebAssembly.instantiate(bytes, importObject);
                });
        }

        promise = promise.then(function (result) {
            wasmExports = (result.instance || result).exports;
        });

        module.exports = {
            __wasm_ready__: promise,
        };

        function ensureExports() {
            if (!wasmExports) {
                throw new Error("The WebAssembly module is not instantiated yet.");
            }
            return wasmExports;
        }

        ${trampolines.join('\n')}
    `;
}

module.exports.raw = true;
