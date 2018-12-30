const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {JSDOM} = require('jsdom');
const {expandMfText, setWorkingDom} = require('../dist/index');

function squashWhitespaces(element) {
    for (let e = element.firstChild; e; ) {
        const next = e.nextSibling;

        if (e.nodeType === 3) { // Text
            e.textContent = e.textContent.trim();
        } else if (e.nodeType === 1) { // Element
            squashWhitespaces(e);
        }

        e = next;
    }
}

function runSingle(textPath, htmlPath) {
    const dom = new JSDOM('<html xmlns="http://www.w3.org/1999/xhtml" />', {
        contentType: 'application/xhtml+xml',
    });
    const document = dom.window.document;
    const body = document.createElement('body');

    // Expand text
    const mfText = document.createElement('mf-text');
    mfText.textContent = fs.readFileSync(textPath, {encoding: 'utf8'});

    body.appendChild(mfText);

    setWorkingDom(dom.window);
    expandMfText(mfText);

    // Load the reference HTML
    const refHtml = fs.readFileSync(htmlPath, {encoding: 'utf8'});
    const refDom = new JSDOM('<html xmlns="http://www.w3.org/1999/xhtml">' +
        `<body>${refHtml}</body></html>`, {
        contentType: 'application/xhtml+xml',
    });
    const refBody = refDom.window.document.getElementsByTagName('body')[0];

    squashWhitespaces(body);
    squashWhitespaces(refBody);

    // Compare
    assert.strictEqual(body.outerHTML, refBody.outerHTML);
}

function scanFixture(dir) {
    const entries = fs.readdirSync(dir, {withFileTypes: true});

    for (const entry of entries) {
        if (entry.isDirectory()) {
            describe(entry.name, () => scanFixture(path.join(dir, entry.name)));
        } else if (entry.isFile() && entry.name.endsWith('.text')) {
            const name = path.join(dir, entry.name);

            const textPath = name;
            let htmlPath = name.substr(0, name.length - 5) + '.html';

            if (!fs.existsSync(htmlPath)) {
                htmlPath = name.substr(0, name.length - 5) + '.xhtml';
            }

            it(entry.name.substr(0, entry.name.length - 5), () => {
                runSingle(textPath, htmlPath);
            });
        }
    }
}

scanFixture(__dirname);
