// The main code to be loaded and executed by a web browser.
if ('あ'.charCodeAt(0) !== 0x3042) {
    throw new Error('The application was loaded with a wrong encoding.');
}

declare var __webpack_public_path__: string;

// Guess the public path based on the script tag.
//
// Without this, late loaded resources (webpack lazy loaded chunks
// and stylesheets) will not load.
const script = document.querySelector('script[data-rel=foremark]');
const basePathMatch = script && (script as HTMLScriptElement).src.match(/^(.*?)[^\/]+$/);
if (basePathMatch) {
    __webpack_public_path__ = basePathMatch[1] + '/';
}

// Load the input from the current document
import {TagNames} from './foremark';
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

// Create `<head>` if it doesn't exist yet
let head = document.getElementsByTagName('head')[0];
if (!head) {
    document.getElementsByTagName('html')[0].appendChild(
        head = document.createElement('head'));
}

// Create `<body>` if it doesn't exist yet
let body = document.getElementsByTagName('body')[0];
if (!body) {
    document.getElementsByTagName('html')[0].appendChild(
        body = document.createElement('body'));
}

// Apply view transformation
import {prepareForemarkForViewing} from './view/mfview';
prepareForemarkForViewing(inputNode);

// Set the page title
const title = inputNode.getElementsByTagName(TagNames.Title)[0];
if (title != null) {
    document.title = title.textContent!.trim();
}

// Add viewport size hint
head.insertAdjacentHTML(
    'beforeend',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />'
);

// Inject stylesheet
if (process.env.INJECT_CSS) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = __webpack_public_path__ + '/foremark.css';
    body.appendChild(style);

    // Hide the page until the stylesheet is loaded
    body.insertAdjacentHTML('beforeend', `<style>
        body { display: none; }
    </style>`);
}

// Create a React root
const reactRoot = document.createElement('mf-app');
body.appendChild(reactRoot);

import * as React from 'preact';
import {App} from './view/app';

React.render(<App foremarkDocument={inputNode as HTMLElement} />, reactRoot);

