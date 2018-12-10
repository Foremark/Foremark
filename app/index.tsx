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

let inputNode = document.querySelector('mf, mf-text');
if (!inputNode) {
    inputNode = document.createElement('mf');
    inputNode.innerHTML = `<mf-error>
        Could not find <code>&lt;mf&gt;</code> nor <code>&lt;mf-text&gt;</code>.
    </mf-error>`;
}

// `<mf-text>` is a shorthand syntax for `<mf><mf-text>...</mf-text></mf>`
if (inputNode.tagName.toLowerCase() === 'mf-text') {
    const mf = document.createElement('mf');
    mf.appendChild(inputNode);
    inputNode = mf;
} else {
    inputNode.parentElement!.removeChild(inputNode);
}

// Expand `<mf-text>`
import {expandMfText} from './converter/mftext';
expandMfText(inputNode);

// Apply view transformation
import {prepareMarkfrontForViewing} from './view/mfview';
prepareMarkfrontForViewing(inputNode);

// Create `<body>` if it doesn't exist yet
let body = document.getElementsByTagName('body')[0];
if (!body) {
    document.getElementsByTagName('html')[0].appendChild(
        body = document.createElement('body'));
}

// Inject stylesheet
const script = document.querySelector('script[data-rel=markfront]');
const basePathMatch = script && (script as HTMLScriptElement).src.match(/^(.*?)[^\/]+$/);
if (basePathMatch) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = basePathMatch[1] + '/markfront.css';
    body.appendChild(style);
}

// Create a React root
const reactRoot = document.createElement('mf-app');
body.appendChild(reactRoot);

import * as React from 'preact';
import {App} from './view/view';

React.render(<App markfrontDocument={inputNode as HTMLElement} />, reactRoot);

