if ('あ'.charCodeAt(0) !== 0x3042) {
    throw new Error('The application was loaded with a wrong encoding.');
}

// Polyfill mainly for IE11
require('./ie11');

// Load the input from the current document
import {Context} from './context';
const context = {
    document: window.document,
    lang: document.getElementsByTagName('html')[0].getAttribute('lang') || '',
};

const inputNode = document.body;

// Expand `<mf-text>`
import {expandMfText} from './mftext';
expandMfText(inputNode);

// Apply view transformation
import {prepareMarkfrontForViewing} from './mfview';
prepareMarkfrontForViewing(inputNode);

require('./view');
