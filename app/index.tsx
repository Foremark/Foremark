if ('あ'.charCodeAt(0) !== 0x3042) {
    throw new Error('The application was loaded with a wrong encoding.');
}

// Load the input from the current document
import {Context} from './context';
const context = {
    document: window.document,
    lang: document.getElementsByTagName('html')[0].getAttribute('lang') || '',
};

import {TagNames} from './markfront';
let inputNode = document.querySelector(`${TagNames.Document}, ${TagNames.Text}`);
if (inputNode == null) {
    inputNode = document.createElement(TagNames.Document);
    inputNode.innerHTML = `<${TagNames.Error}>
        Could not find <code>&lt;${TagNames.Document}&gt;</code> nor <code>&lt;${TagNames.Text}&gt;</code>.
    </${TagNames.Error}>`;
}

// `<mf-text>` is a shorthand syntax for `<mf><mf-text>...</mf-text></mf>`
if (inputNode.tagName.toLowerCase() === TagNames.Text) {
    const mf = document.createElement(TagNames.Document);
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
if (process.env.INJECT_CSS) {
    const script = document.querySelector('script[data-rel=markfront]');
    const basePathMatch = script && (script as HTMLScriptElement).src.match(/^(.*?)[^\/]+$/);
    if (basePathMatch) {
        const style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = basePathMatch[1] + '/markfront.css';
        body.appendChild(style);
    }
}

// Create a React root
const reactRoot = document.createElement('mf-app');
body.appendChild(reactRoot);

import * as React from 'preact';
import {App} from './view/app';

React.render(<App markfrontDocument={inputNode as HTMLElement} />, reactRoot);

