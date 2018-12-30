const assert = require('assert');

describe('utils/array', () => {
    const arrayUtils = require('../dist/utils/array');

    describe('arrayRemoveElement', () => {
        const {arrayRemoveElement} = arrayUtils;

        it('should remove a matching element 1', () => {
            assert.deepStrictEqual(arrayRemoveElement([1, 2, 3], 1), [2, 3]);
        });

        it('should remove a matching element 2', () => {
            assert.deepStrictEqual(arrayRemoveElement([1, 2, 3], 2), [1, 3]);
        });

        it('should remove a matching element 3', () => {
            assert.deepStrictEqual(arrayRemoveElement([1, 2, 3], 3), [1, 2]);
        });

        it('should remove only the first matching element', () => {
            assert.deepStrictEqual(arrayRemoveElement([1, 1, 2], 1), [1, 2]);
        });

        it('does nothing if no element matches', () => {
            assert.deepStrictEqual(arrayRemoveElement([1, 2, 3], 4), [1, 2, 3]);
        });
    });
});

describe('utils/lazy/Lazy', () => {
    const {Lazy} = require('../dist/utils/lazy');

    it('should evaluate lazily', () => {
        let a = 0;
        const aLazy = new Lazy(() => ++a);
        assert.strictEqual(a, 0);
        assert.strictEqual(aLazy.value, 1);
        assert.strictEqual(a, 1);
        assert.strictEqual(aLazy.value, 1);
        assert.strictEqual(a, 1);
    });
});

describe('utils/string', () => {
    const stringUtils = require('../dist/utils/string');

    describe('removePrefix', () => {
        const {removePrefix} = stringUtils;

        it('should remove "12" from "123"', () => {
            assert.strictEqual(removePrefix('123', '12'), '3');
        });

        it('should return "3" when told to remove "124" from "123"', () => {
            assert.strictEqual(removePrefix('123', '124'), '3');
        });

        it('should return "123" when told to remove "32" from "123"', () => {
            assert.strictEqual(removePrefix('123', '32'), '123');
        });
    });

    describe('analyzeIndent', () => {
        const {analyzeIndent} = stringUtils;

        it('returns "Indent" when `indent` has more characters', () => {
            assert.strictEqual(analyzeIndent('12', '1'), 1);
        });

        it('returns "Outdent" when `indent` has less characters', () => {
            assert.strictEqual(analyzeIndent('1', '12'), 2);
        });

        it('returns "Preserve" when `indent` is equal to `ref`', () => {
            assert.strictEqual(analyzeIndent('12', '12'), 0);
        });

        it('returns "Outdent" when the common longest prefix is shorter than `ref`', () => {
            assert.strictEqual(analyzeIndent('1', '12'), 2);
            assert.strictEqual(analyzeIndent('13', '12'), 2);
            assert.strictEqual(analyzeIndent('132', '12'), 2);
        });
    });

    describe('escapeRegExp', () => {
        const {escapeRegExp} = stringUtils;

        it('escapes special characters', () => {
            assert.strictEqual(escapeRegExp('['), '\\[');
            assert.strictEqual(escapeRegExp(']'), '\\]');
            assert.strictEqual(escapeRegExp('('), '\\(');
            assert.strictEqual(escapeRegExp(')'), '\\)');
            assert.strictEqual(escapeRegExp('{'), '\\{');
            assert.strictEqual(escapeRegExp('}'), '\\}');
            assert.strictEqual(escapeRegExp('|'), '\\|');
            assert.strictEqual(escapeRegExp('\\'), '\\\\');
            assert.strictEqual(escapeRegExp('$'), '\\$');
            assert.strictEqual(escapeRegExp('^'), '\\^');
            assert.strictEqual(escapeRegExp('+'), '\\+');
            assert.strictEqual(escapeRegExp('?'), '\\?');
            assert.strictEqual(escapeRegExp('*'), '\\*');
            assert.strictEqual(escapeRegExp('.'), '\\.');
        });
    });
});