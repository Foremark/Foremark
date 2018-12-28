// The main code to be loaded and executed by a web browser.

// Load the input from the current document
import {TagNames} from './foremark';
let inputNode = document.querySelector(`${TagNames.Document}, ${TagNames.Text}`);
if (inputNode == null) {
    inputNode = document.createElement(TagNames.Document);
    inputNode.innerHTML = `<${TagNames.Error}>
        Could not find <code>&lt;${TagNames.Document}&gt;</code> nor <code>&lt;${TagNames.Text}&gt;</code>.
    </${TagNames.Error}>`;
}

// Load the viewer config
import {loadViewerConfigFromWindow} from './view/config';
const viewerConfig = loadViewerConfigFromWindow();

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

const head = document.getElementsByTagName('head')[0]!;
const body = document.getElementsByTagName('body')[0]!;

// Apply view transformation
import {prepareForemarkForViewing} from './view/mfview';
prepareForemarkForViewing(inputNode, viewerConfig);

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

// Create a React root
const reactRoot = document.createElement('mf-app');
body.appendChild(reactRoot);

import * as React from 'preact';
import {App} from './view/app';

React.render(<App foremarkDocument={inputNode as HTMLElement} />, reactRoot);

