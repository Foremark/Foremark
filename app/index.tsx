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

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {App} from './view';

ReactDOM.render(<App markfrontDocument={markfrontRoot} />, reactRoot);

