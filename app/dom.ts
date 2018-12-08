import {encodeHTML, decodeHTML} from 'entities';

/** Inlined constants from `NodeType`. */
const enum NodeType {
    ELEMENT_NODE = 1,
    TEXT_NODE = 3,
    CDATA_SECTION_NODE = 4,
    PROCESSING_INSTRUCTION_NODE = 7,
    COMMENT_NODE = 8,
    DOCUMENT_NODE = 9,
    DOCUMENT_TYPE_NODE = 10,
    DOCUMENT_FRAGMENT_NODE = 11,
}

let nextPlaceholderId = 1;
function placeholderHtmlWithId(i: any): string {
    return `<mf-ph id="${i}" />`;
}
const PLACEHOLDER_REGEX = /<mf-ph id="([0-9]+)" \/>/;

/**
 * Transforms the HTML markup of a given node's contents using a supplied
 * function.
 *
 * Before passing a HTML markup to a given function, this function protects
 * child elements by replacing them with placeholders.
 */
export function transformHtmlWith(node: Node, tx: (s: string) => string) {
    switch (node.nodeType) {
        case NodeType.TEXT_NODE:
        case NodeType.CDATA_SECTION_NODE:
            node.textContent = decodeHTML(tx(
                node.textContent!
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
            ));
            break;
        case NodeType.ELEMENT_NODE:
            if (!(node instanceof Element)) {
                throw new Error();
            }

            // Get the inner HTML
            const placeholders = new Map<string, Node>();
            let html = '';
            for (let n: Node | null = node.firstChild; n; n = n.nextSibling) {
                if (n instanceof Text) {
                    html += n.textContent!
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                } else {
                    let placeholderId = String(nextPlaceholderId++);
                    placeholders.set(placeholderId, n);
                    html += placeholderHtmlWithId(placeholderId);
                }
            }

            const orig = html;
            html = tx(html);

            if (orig === html) {
                return;
            }

            // Replace the old contents
            node.innerHTML = '';

            const parts = html.split(PLACEHOLDER_REGEX);

            if (parts[0] !== '') {
                node.innerHTML = parts[0];
            }

            for (let i = 1; i < parts.length; i += 2) {
                let placeholderId = parts[i];
                node.appendChild(placeholders.get(placeholderId)!);
                node.insertAdjacentHTML('beforeend', parts[i + 1]);
            }

            break;
    }
}
