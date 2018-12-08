import {highlightAuto} from '../lib/highlight';
import * as katex from 'katex';

/**
 * Transforms Markfront XML for viewing.
 */
export function prepareMarkfrontForViewing(node: Element): void {
    const tagName = node.tagName.toLowerCase();
    if (HANDLERS.hasOwnProperty(tagName)) {
        HANDLERS[tagName](node);
    } else {
        for (let n: Node | null = node.firstChild; n; n = n.nextSibling) {
            if (n instanceof Element) {
                prepareMarkfrontForViewing(n);
            }
        }
    }
}

const katexInlineOptions = {
    // These macros are defined by Markdeep
    macros: {
        '\\n': '\\hat{n}',
        '\\w': '{\\hat{\\omega}}',
        '\\wi': '{\\w_\\mathrm{i}}',
        '\\wo': '{\\w_\\mathrm{o}}',
        '\\wh': '{\\w_\\mathrm{h}}',
        '\\Li': '{L_\\mathrm{i}}',
        '\\Lo': '{L_\\mathrm{o}}',
        '\\Le': '{L_\\mathrm{e}}',
        '\\Lr': '{L_\\mathrm{r}}',
        '\\Lt': '{L_\\mathrm{t}}',
        '\\O': '{\\mathrm{O}}',
        '\\degrees': '{{^{\\large\\circ}}}',
        '\\T': '{\\mathsf{T}}',
        '\\mathset': '[1]{\\mathbb{#1}}',
        '\\Real': '{\\mathset{R}}',
        '\\Integer': '{\\mathset{Z}}',
        '\\Boolean': '{\\mathset{B}}',
        '\\Complex': '{\\mathset{C}}',
    },
    throwOnError: false,
} as katex.KatexOptions;
const katexDisplayOptions: katex.KatexOptions = {
    displayMode: true,
    ... katexInlineOptions,
};

require('../lib/katex.less');

const HANDLERS: { [tagName: string]: (node: Element) => void } & Object = {
    'mf-eq': node => {
        node.innerHTML = katex.renderToString(node.textContent || '', katexInlineOptions);
    },
    'mf-eq-display': node => {
        node.innerHTML = katex.renderToString(node.textContent || '', katexDisplayOptions);
    },
    'mf-code': node => {
        const type = (node.getAttribute('type') || '').split(' ');
        const lang = type[0];
        if (lang === '') {
            return;
        }

        const highlighted = highlightAuto(node.textContent || '', [lang]);
        node.innerHTML = highlighted.value;

        // TODO: line numbers
    },
    'mf-diagram': node => {
        // TODO
    },
};
