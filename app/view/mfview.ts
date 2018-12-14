import {highlightAuto} from '../../lib/highlight';
import * as katex from 'katex';

import {forEachNodePreorder} from '../utils/dom';
import {TagNames, AttributeNames} from '../markfront';

/**
 * Transforms Markfront XML for viewing.
 */
export function prepareMarkfrontForViewing(node: Element): void {
    // Modify headings
    const counter = new Float64Array(10);
    const names: string[] = ['', '', '', '', '', '', '', '', '', ''];
    forEachNodePreorder(node, node => {
        if (!(node instanceof Element)) {
            return;
        }
        const match = node.tagName.match(/^h([1-9])$/i);
        if (match) {
            const level = parseInt(match[1], 10);
            counter[level] += 1;
            for (let i = level + 1; i < counter.length; ++i) {
                counter[i] = 0;
            }

            // Section number in `1.2.3` style
            const number = Array.prototype.slice.call(counter, 1, level + 1).join('.');

            // Determine the ID of the heading. If it doesn't have one, generate
            // one in a Markdeep-compatible way.
            names[level] = encodeURI((node.textContent || '').replace(/\s/g, '').toLowerCase());
            if (!names[level]) {
                // If the heading is empty for some reasons, just use the
                // heading number
                names[level] = number;
            }
            if (level > 1) {
                names[level] = names[level - 1] + '/' + names[level];
            }
            for (let i = level + 1; i < counter.length; ++i) {
                names[i] = names[level];
            }

            let id = node.getAttribute('id');
            if (!id) {
                id = names[level];
            }

            // Insert `<a>` for each heading
            node.removeAttribute('id');
            node.setAttribute('data-anchor', id);
            const a = document.createElement('a');
            a.id = id;
            a.className = 'anchor';
            node.parentElement!.insertBefore(a, node);

            // Display the section number
            node.insertAdjacentHTML('afterbegin', `<span class="section-number">${number}</span> `);
        }
    });

    // Render complex elements
    forEachNodePreorder(node, node => {
        if (node instanceof Element) {
            const tagName = node.tagName.toLowerCase();
            if (HANDLERS.hasOwnProperty(tagName)) {
                HANDLERS[tagName](node);
                return false;
            }
        }
        return true;
    });
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

const HANDLERS: { [tagName: string]: (node: Element) => void } & Object = {
    [TagNames.Equation]: node => {
        node.innerHTML = katex.renderToString(node.textContent || '', katexInlineOptions);
    },
    [TagNames.DisplayEquation]: node => {
        node.innerHTML = katex.renderToString(node.textContent || '', katexDisplayOptions);
    },
    [TagNames.Code]: node => {
        const type = (node.getAttribute(AttributeNames.CodeType) || '').split(' ');
        const lang = type[0];
        if (lang === '') {
            return;
        }

        const highlighted = highlightAuto(node.textContent || '', [lang]);
        node.innerHTML = highlighted.value;

        // TODO: line numbers
    },
    [TagNames.Diagram]: node => {
        // TODO
    },
};
