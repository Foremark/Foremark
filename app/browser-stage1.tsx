// The main code to be loaded and executed by a web browser.
import * as React from 'preact';
import {App} from './view/app';

import {TagNames} from './foremark';
import {loadViewerConfigFromWindow} from './view/config';
import {expandMfText} from './converter/mftext';
import {prepareForemarkForViewing} from './view/mfview';
import {processSitemap} from './view/sitemap';
import {checkXhtml} from './utils/dom';

export async function browserMain(): Promise<void> {
    // Fail if not XHTML
    checkXhtml();

    // Load the input from the current document
    let inputNode = document.querySelector(`${TagNames.Document},${TagNames.Text},pre`);
    if (inputNode == null) {
        inputNode = document.createElement(TagNames.Document);
        inputNode.innerHTML = `<${TagNames.Error}>
            Could not find <code>&lt;${TagNames.Document}&gt;</code> nor <code>&lt;${TagNames.Text}&gt;</code>.
        </${TagNames.Error}>`;
    }

    // Load the viewer config
    const [viewerConfig, configErrors] = await loadViewerConfigFromWindow();

    // Load the sitemap
    const [sitemap, sitemapErrors] = processSitemap(
        viewerConfig.sitemap, viewerConfig.sitemapDocumentRoot);

    // `<mf-text>` and `<pre>` are a shorthand syntax for
    // `<mf-document><mf-text>...</mf-text></mf-document>`
    if (/^pre$/i.test(inputNode.tagName)) {
        const mf = document.createElement(TagNames.Document);
        const mfText = document.createElement(TagNames.Text);
        while (inputNode.firstChild) {
            mfText.appendChild(inputNode.firstChild);
        }
        mf.appendChild(mfText);
        inputNode = mf;
    } else if (inputNode.tagName.toLowerCase() === TagNames.Text) {
        const mf = document.createElement(TagNames.Document);
        mf.appendChild(inputNode);
        inputNode = mf;
    } else {
        inputNode.parentElement!.removeChild(inputNode);
    }

    // Expand `<mf-text>`
    expandMfText(inputNode);

    const head = document.getElementsByTagName('head')[0]!;
    const body = document.getElementsByTagName('body')[0]!;

    // Apply view transformation
    const renderPromise = prepareForemarkForViewing(inputNode, viewerConfig);

    // Set the page title
    const title = inputNode.getElementsByTagName(TagNames.Title)[0];
    if (title != null) {
        document.title = title.textContent!.trim();
    }

    // Display errors
    if (configErrors.length) {
        const errorTag = document.createElement(TagNames.Error);
        errorTag.innerHTML = `An error occured while loading configuration:<ul><li>` +
            configErrors.join('</li><li>') + `</li></ul>`;
        inputNode.insertBefore(errorTag, inputNode.firstChild);
    }

    if (sitemapErrors.length) {
        const errorTag = document.createElement(TagNames.Error);
        errorTag.innerHTML = `An error occured while loading a sitemap:<ul><li>` +
            sitemapErrors.join('</li><li>') + `</li></ul>`;
        inputNode.insertBefore(errorTag, inputNode.firstChild);
    }

    // Add viewport size hint
    head.insertAdjacentHTML(
        'beforeend',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0" />'
    );

    // Create a React root
    const reactRoot = document.createElement('mf-app');
    body.appendChild(reactRoot);

    React.render(<App
        foremarkDocument={inputNode as HTMLElement}
        sitemap={sitemap}
        renderPromise={renderPromise}
    />, reactRoot);
}
