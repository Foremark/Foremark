const assert = require('assert');

const {setWorkingDom} = require('../dist/index');
const {JSDOM} = require('jsdom');

const dom = new JSDOM('<html xmlns="http://www.w3.org/1999/xhtml" />', {
    contentType: 'application/xhtml+xml',
});
setWorkingDom(dom.window);

describe('utils/dom', () => {
    const domUtils = require('../dist/utils/dom');

    describe('legalizeAttributes', () => {
        const {legalizeAttributes} = domUtils;

        it('should handle input with a new line character', () => {
            assert.strictEqual(legalizeAttributes(' \n', []), ' \n');
        });

        it('should handle empty input', () => {
            assert.strictEqual(legalizeAttributes('', []), '');
        });
    });
});
