import {highlightAuto} from '../lib/highlight';

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

const HANDLERS: { [tagName: string]: (node: Element) => void } & Object = {
    'mf-eq': node => {
        // TODO
    },
    'mf-eq-display': node => {
        // TODO
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
