const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {JSDOM} = require('jsdom');
const {expandMfText, setWorkingDom} = require('../dist/index');
const {forEachNodePreorder} = require('../dist/utils/dom');

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

function runSingle(text, refHtml) {
    const dom = new JSDOM('<html xmlns="http://www.w3.org/1999/xhtml" />', {
        contentType: 'application/xhtml+xml',
    });
    const document = dom.window.document;
    const body = document.createElement('body');

    // Expand text
    const mfText = document.createElement('mf-text');
    mfText.textContent = text;

    body.appendChild(mfText);

    setWorkingDom(dom.window);
    expandMfText(mfText);

    // Load the reference HTML
    const refDom = new JSDOM('<html xmlns="http://www.w3.org/1999/xhtml">' +
        `<body>${refHtml}</body></html>`, {
        contentType: 'application/xhtml+xml',
    });
    const refBody = refDom.window.document.getElementsByTagName('body')[0];

    squashWhitespaces(body);
    squashWhitespaces(refBody);

    // Compare
    const prettify = s => s.replace(/<\/?p>/g, '$&\n');
    assert.strictEqual(
        prettify(body.outerHTML),
        prettify(refBody.outerHTML),
    );
}

function scanDoctest(doctext) {
    const dom = new JSDOM(doctext, {
        contentType: 'application/xhtml+xml',
    });

    setWorkingDom(dom.window);
    expandMfText(dom.window.document.body);

    const headings = [{
        name: 'Top level',
        tests: [],
    }];
    const headingCounter = [0];

    forEachNodePreorder(dom.window.document.body, node => {
        if (node.nodeType !== 1) {
            return;
        }
        if (/h[1-9]/.test(node.tagName)) {
            const level = parseInt(node.tagName.substr(1), 10) - 1;
            headingCounter[level]++;
            for (let i = level + 1; i < 10; ++i) {
                headingCounter[i] = 0;
            }
            headings.push({
                name: headingCounter.slice(0, level + 1).join('.') + ' ' + node.textContent,
                tests: [],
            });
        } else if (node.tagName === 'mf-codeblock') {
            const code = node.getElementsByTagName('mf-code');
            if (
                code.length !== 2 || 
                code[1].getAttribute('type') !== 'XML converted'
            ) {
                return false;
            }

            const text = code[0].textContent;
            const html = code[1].textContent;
            headings[headings.length - 1].tests.push({text, html});

            return false;
        }
    });

    for (const heading of headings) {
        describe(heading.name, () => {
            for (const test of heading.tests) {
                let testName = test.text.replace(/\s+/g, ' ');
                if (testName.length > 20) {
                    testName = testName.substr(0, 20) + "...";
                }
                it(`"${testName}"`, () => {
                    runSingle(test.text, test.html);
                });
            }
        });
    }
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
                const text = fs.readFileSync(textPath, {encoding: 'utf8'});
                const html = fs.readFileSync(htmlPath, {encoding: 'utf8'});
                runSingle(text, html);
            });
        }
    }
}

scanFixture(__dirname);

describe('reference.mf.xhtml', () => {
    const p = path.join(__dirname, '../examples/reference.mf.xhtml');
    scanDoctest(fs.readFileSync(p, {encoding: 'utf8'}));
});
