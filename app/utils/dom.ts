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
function placeholderHtmlWithId(name: string, i: any): string {
    return `<${name} ph-id="${i}" />`;
}
const PLACEHOLDER_REGEX = /<[-_a-zA-Z0-9]+ ph-id="([0-9]+)" \/>/g;
const PLACEHOLDER_ATTR = 'ph-id';

/**
 * Transforms the HTML markup of a given node's contents using a supplied
 * function.
 *
 * Before passing a HTML markup to a given function, this function protects
 * child elements by replacing them with placeholders. A placeholder is a
 * self-closing tag that looks like `<tagname ph-id="12345" />`. The tag name is
 * identical to the original tag name (if the original node was an element), or
 * `mf-ph` (otherwise).
 *
 * If `recursionFilter` is specified, the contents of a child element is
 * transformed as well if the element matches the predicate specified by
 * `recursionFilter`.
 */
export function transformHtmlWith(
    node: Element,
    tx: (s: string) => string,
    recursionFilter?: (e: Element) => boolean,
) {
    // Get the inner HTML
    const placeholders = new Map<string, Node>();
    let html = '';
    for (let n: Node | null = node.firstChild; n; n = n.nextSibling) {
        if (n instanceof Text) {
            html += n.textContent!
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        } else if (n instanceof Element) {
            if (recursionFilter && recursionFilter(n)) {
                transformHtmlWith(n, tx, recursionFilter);
            }

            let placeholderId = String(nextPlaceholderId++);
            placeholders.set(placeholderId, n);
            html += placeholderHtmlWithId(n.tagName, placeholderId);
        } else {
            let placeholderId = String(nextPlaceholderId++);
            placeholders.set(placeholderId, n);
            html += placeholderHtmlWithId('mf-ph', placeholderId);
        }
    }

    const orig = html;
    html = tx(html);

    if (orig === html) {
        return;
    }

    // Replace the old contents
    html = html.replace(
        PLACEHOLDER_REGEX,
        `<mf-ph ${PLACEHOLDER_ATTR}="$1"></mf-ph>`
    );
    node.innerHTML = html;

    if (placeholders.size === 0) {
        return;
    }

    // Put the original elements back
    function fillPlaceholders(e: Element): void {
        if (e.tagName === 'mf-ph' || e.tagName === 'MF-PH') {
            const id = e.getAttribute(PLACEHOLDER_ATTR);
            const original = id && placeholders.get(id);
            if (original) {
                const parent = e.parentElement!;
                parent.insertBefore(original, e);
                parent.removeChild(e);
                return;
            }
        }

        for (let child: Node | null = e.firstChild; child; ) {
            const next = child.nextSibling;
            if (child instanceof Element) {
                fillPlaceholders(child);
            }
            child = next;
        }
    }

    fillPlaceholders(node);
}

/**
 * Iterate all nodes in pre-order using a callback function.
 *
 * Child nodes are not traversed if the callback function returns `false`.
 */
export function forEachNodePreorder(node: Node, f: (node: Node) => boolean | void) {
    if (f(node) === false) {
        return;
    }
    if (node instanceof Element) {
        for (let n: Node | null = node.firstChild; n; n = n.nextSibling) {
            forEachNodePreorder(n, f);
        }
    }
}

/**
 * Attempts to fix malformed XML attributes.
 *
 * Example: `legalizeAttributes(' a b="<>"')` returns `' a="a" b="&lt;&gt;"'`.
 */
export function legalizeAttributes(xml: string, onwarning: (message: string) => void = () => {}): string {
    const [_, spaces, inner] = xml.match(/^(\s*)(.*)$/)!;

    return spaces + (' ' + inner).replace(
        // This regex matches a XML attribute with rather forgiving syntax.
        // The union of all matches must cover entire the input except for
        // trailing whitespace characters (if any).
        /(\s*)([^\s=]+)(?:(\s*=\s)*("[^"]*"?|'[^']*'?|[^"'\s]+)?)?/ig,
        //^^^  ^^^^^^^^             ^^^^^^^^ ^^^^^^^^ ^^^^^^^^
        // |    name                 "value"  'value'  value
        // +-- separating space
        (_, space, name, equal?: string, value?: string) => {
            if (space === '') {
                onwarning("A separator between attributes is missing.");
                space = ' ';
            }
            if (!isValidXmlName(name)) {
                onwarning(`Invalid attribute name: '${name}'`);
                return '';
            }

            if (equal == null) {
                // Value elision - valid in HTML, so do not issue a warning
                equal = '=';
                value = `"${escapeXmlText(name)}"`;
            } else if (value == null) {
                onwarning(`Value for attribute '${name}' is missing.`);
                value = '""';
            } else {
                // Expand and re-escpae the value in either case
                if (value.startsWith('"')) {
                    if (value.endsWith('"')) {
                        value = value.substring(1, value.length - 1);
                    } else {
                        value = value.substr(1);
                        onwarning(`Value for attribute '${name}' has no closing quotation mark.`);
                    }
                } else if (value.startsWith("'")) {
                    if (value.endsWith("'")) {
                        value = value.substring(1, value.length - 1);
                    } else {
                        value = value.substr(1);
                        onwarning(`Value for attribute '${name}' has no closing quotation mark.`);
                    }
                } else {
                    // Quotation mark elision - probably valid in HTML
                }

                value = `"${escapeXmlText(value)}"`;
            }

            return space + name + equal + value;
        }
    ).substr(1);
}

const testElement = document.createElement('i');

/**
 * Matches a given string against [XML NCName](http://www.w3.org/TR/1999/REC-xml-names-19990114/#NT-NCName).
 */
function isValidXmlName(name: string): boolean {
    // Fast path - This also prevents collision with the attributes that have
    // a meaning predefined by the HTML specification.
    if (name.match(/[a-zA-Z][-\w]*/)) {
        return true;
    }

    return isValidXmlNameSlow(name);
}

function isValidXmlNameSlow(name: string): boolean {
    // I could've used <https://www.npmjs.com/package/ncname>, but that would
    // increase the bundle size and the number of dependencies.
    try {
        testElement.setAttribute(name, "1");
        return true;
    } finally {
        testElement.removeAttribute(name);
    }
    return false;
}

export function escapeXmlText(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
