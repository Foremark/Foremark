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

// Move the contents into a detached DOM element
const markfrontRoot = document.createElement('article');
for (let e: Node | null = inputNode.firstChild; e; ) {
    const next = e.nextSibling;
    if (!(e instanceof Element) || (e.tagName !== 'SCRIPT' && e.tagName !== 'script')) {
        markfrontRoot.appendChild(e);
    }
    e = next;
}

// Create a React root
const reactRoot = document.createElement('mf-app');
document.body.appendChild(reactRoot);

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {App} from './view';

ReactDOM.render(<App markfrontDocument={markfrontRoot} />, reactRoot);

