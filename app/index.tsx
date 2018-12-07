if ('あ'.charCodeAt(0) !== 0x3042) {
    throw new Error('The application was loaded with a wrong encoding.');
}

// Polyfill mainly for IE11
require('./ie11');

console.log("yeehaw");
