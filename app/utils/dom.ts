export const enum InternalTagNames {
    /**
     * The tag name used for placeholders by `transformHtmlWith`. However,
     * if the replaced node is an element, then the name of the element will be
     * used instead.
     */
    Placeholder = 'mf-ph',
}

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

let testElement: HTMLElement;

/**
 * Constructors of DOM types;
 *
 * Node.js does not provide DOM types, so they must be supplied externally
 * when we are in a Node.js environment.
 */
export let DomTypes: DomTypes;

export interface DomTypes {
    Text: typeof Text;
    Element: typeof Element;
    HTMLElement: typeof HTMLElement;
}

export interface Dom extends DomTypes {
    document: Document;
}

/**
 * Specifies a DOM global object used for internal operations.
 *
 * You must call this function first if the library is being used in a Node.js
 * environment.
 *
 * # Example
 *
 *     import {JSDOM} from 'jsdom';
 *     const dom = new JSDOM('<html />', {
 *         contentType: 'application/xml',
 *     });
 *     setWorkingDom(dom.window);
 *
 */
export function setWorkingDom(window: Dom) {
    const e = window.document.createElement('i');
    if (e.tagName !== 'i') {
        throw new Error("Sanity check failed - maybe the document is not XML?");
    }

    testElement = e;
    DomTypes = window;
}

if (typeof window !== 'undefined') {
    setWorkingDom(window as any);
}

export interface TransformHtmlWithContext {
    /**
     * Expands all placeholders in a given HTML markup.
     *
     * Note: Currently, only elements are expanded.
     */
    expand(html: string): string;
}

/**
 * Transforms the HTML markup of a given node's contents using a supplied
 * function.
 *
 * Before passing a HTML markup to a given function, this function protects
 * child elements by replacing them with placeholders. A placeholder is a
 * self-closing tag that looks like `<tagname ph-id="12345" />`. The tag name is
 * identical to the original tag name (if the original node was an element), or
 * `InternalTagNames.Placeholder` (otherwise).
 *
 * If `recursionFilter` is specified, the contents of a child element is
 * transformed as well if the element matches the predicate specified by
 * `recursionFilter`.
 */
export function transformHtmlWith(
    node: Element,
    tx: (s: string, ctx: TransformHtmlWithContext) => string,
    recursionFilter?: (e: Element) => boolean,
    reverse?: boolean,
) {
    if (reverse) {
        for (let n: Node | null = node.lastChild; n; ) {
            const next = n.previousSibling;
            if (n instanceof DomTypes.Element && recursionFilter && recursionFilter(n)) {
                transformHtmlWith(n, tx, recursionFilter);
            }
            n = next;
        }
    } else {
        for (let n: Node | null = node.firstChild; n; ) {
            const next = n.nextSibling;
            if (n instanceof DomTypes.Element && recursionFilter && recursionFilter(n)) {
                transformHtmlWith(n, tx, recursionFilter);
            }
            n = next;
        }
    }

    // Get the inner HTML
    const placeholders = new Map<string, Node>();
    let html = '';
    for (let n: Node | null = node.firstChild; n; n = n.nextSibling) {
        if (n instanceof DomTypes.Text) {
            html += n.textContent!
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        } else if (n instanceof DomTypes.Element) {
            if (recursionFilter && recursionFilter(n)) {
                transformHtmlWith(n, tx, recursionFilter);
            }

            let placeholderId = String(nextPlaceholderId++);
            placeholders.set(placeholderId, n);
            html += placeholderHtmlWithId(n.tagName, placeholderId);
        } else {
            let placeholderId = String(nextPlaceholderId++);
            placeholders.set(placeholderId, n);
            html += placeholderHtmlWithId(InternalTagNames.Placeholder, placeholderId);
        }
    }

    const ctx: TransformHtmlWithContext = {
        expand(html: string): string {
            return html.replace(
                PLACEHOLDER_REGEX,
                (match, id) => {
                    const original = placeholders.get(id);
                    if (original instanceof DomTypes.HTMLElement) {
                        return original.outerHTML;
                    } else {
                        return match;
                    }
                },
            );
        },
    };

    const orig = html;
    html = tx(html, ctx);

    if (orig === html) {
        return;
    }

    // Replace the old contents
    html = html.replace(
        PLACEHOLDER_REGEX,
        `<${InternalTagNames.Placeholder} ${PLACEHOLDER_ATTR}="$1"></${InternalTagNames.Placeholder}>`
    );
    node.innerHTML = html;

    if (placeholders.size === 0) {
        return;
    }

    // Put the original elements back
    function fillPlaceholders(e: Element): void {
        if (e.tagName === InternalTagNames.Placeholder) {
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
            if (child instanceof DomTypes.Element) {
                fillPlaceholders(child);
            }
            child = next;
        }
    }

    fillPlaceholders(node);
}

/**
 * Transforms the HTML markup of text nodes in a given node using a supplied
 * function.
 *
 * The HTML markup of a text node is passed to `tx`. `tx` returns a transformed
 * HTML markup, which may include other kinds of nodes.
 *
 * If `recursionFilter` is specified, the contents of a child element is
 * transformed as well if the element matches the predicate specified by
 * `recursionFilter`.
 *
 * This function is theoretically faster than `transformHtmlWith`. This function
 * can be used in place of `transformHtmlWith` if:
 *
 *  - Replaced substrings never include a XML element.
 *  - Replaced substrings are not insensitive to context such as line breaks and
 *    the start and end of an input string.
 *  - In addition, there are no sequences of two or more consecutive text nodes.
 *
 */
export function transformTextNodeWith(
    node: Node,
    tx: (s: string) => string,
    recursionFilter: (e: Element) => boolean | void,
    reverse: boolean,
) {
    (reverse ? forEachNodeReversePreorder : forEachNodePreorder)(node, node => {
        if (node instanceof DomTypes.Element) {
            return recursionFilter(node);
        } else if (node instanceof DomTypes.Text) {
            let html = node.textContent!
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            const orig = html;
            html = tx(html);

            if (orig === html) {
                return;
            }

            // Deserialize the transformed XML (Yep, `Text` does not have
            // `outerHTML` or `insertAdjacentHTML`.)
            testElement.innerHTML = html;

            while (testElement.firstChild != null) {
                node.parentElement!.insertBefore(testElement.firstChild, node);
            }

            node.parentElement!.removeChild(node);
        }
    });
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
    if (node instanceof DomTypes.Element) {
        for (let n: Node | null = node.firstChild; n; ) {
            const next = n.nextSibling;
            forEachNodePreorder(n, f);
            n = next;
        }
    }
}

/**
 * Iterate all nodes in pre-order using a callback function. The iteration order
 * of child nodes is reversed.
 *
 * Child nodes are not traversed if the callback function returns `false`.
 */
export function forEachNodeReversePreorder(node: Node, f: (node: Node) => boolean | void) {
    if (f(node) === false) {
        return;
    }
    if (node instanceof DomTypes.Element) {
        for (let n: Node | null = node.lastChild; n; ) {
            const next = n.previousSibling;
            forEachNodePreorder(n, f);
            n = next;
        }
    }
}

/**
 * Attempts to fix malformed XML attributes.
 *
 * `attributeNames` specifies the list of other attributes used to reject
 * duplicate attributes. Found attributes are added to `attributeNames`.
 *
 * Example: `legalizeAttributes(' a b="<>"')` returns `' a="a" b="&lt;&gt;"'`.
 *
 * # Positional attributes
 *
 * This function can automatically add a name to an attribute without one. The
 * attribute names are chosen from `positionalAttributes`.
 */
export function legalizeAttributes(
    xml: string,
    attributeNames: string[],
    onwarning: (message: string) => void = () => {},
    positionalAttributes?: ArrayLike<string>,
): string {
    if (xml === '') {
        return xml;
    }
    const [_, spaces, inner] = xml.match(/^(\s*)([^]*)$/)!;
    let nextIndex = 0;

    return spaces + (' ' + inner).replace(
        // This regex matches a XML attribute with rather forgiving syntax.
        // The union of all matches must cover entire the input except for
        // trailing whitespace characters (if any).
        /(\s*)(?:([^"'\s=][^\s=]*)(?:(\s*=\s*)("[^"]*"?|'[^']*'?|[^"'\s]+)?)?|("[^"]*"?|'[^']*'?))/ig,
        //^^^     ^^^^^^^^^^^^^^^             ^^^^^^^^ ^^^^^^^^ ^^^^^^^^       ^^^^^^^^^^^^^^^^^
        // |       name                        "value"  'value'  value      positional attr.
        // +-- separating space
        (_, space, name, equal?: string, value?: string, posAttr?: string) => {
            if (space === '') {
                onwarning("A separator between attributes is missing.");
                space = ' ';
            }

            if (posAttr) {
                if (!positionalAttributes) {
                    onwarning(`Attribute name is missing.`);
                    return '';
                }
                if (nextIndex >= positionalAttributes.length) {
                    onwarning(`No more positional attributes.`);
                    return '';
                }
                name = positionalAttributes[nextIndex++];
                equal = '=';
                value = posAttr;
            } else {
                if (!isValidXmlName(name)) {
                    onwarning(`Invalid attribute name: '${name}'`);
                    return '';
                }
            }

            if (attributeNames.indexOf(name) >= 0) {
                onwarning(`Duplicate attribute: '${name}'`);
                return '';
            }
            attributeNames.push(name);

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

                value = unescapeXmlText(value);

                value = `"${escapeXmlText(value)}"`;
            }

            return space + name + equal + value;
        }
    ).substr(1);
}

/**
 * Matches a given string against [XML NCName](http://www.w3.org/TR/1999/REC-xml-names-19990114/#NT-NCName).
 */
function isValidXmlName(name: string): boolean {
    // Fast path - This also prevents collision with the attributes that have
    // a meaning predefined by the HTML specification.
    if (name.match(/^[a-zA-Z][-\w]*$/)) {
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
    } catch (_) {
        return false;
    } finally {
        testElement.removeAttribute(name);
    }
}

export function escapeXmlText(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export function unescapeXmlText(xml: string): string {
    // I could've used <https://www.npmjs.com/package/entities>, but that would
    // increase the bundle size and the number of dependencies.

    return xml.replace(/&.*?;/g, match => {
        // Numeric character reference
        if (/&#x[0-9a-f]+;/i.test(match)) {
            const i = parseInt(match.substring(3, match.length - 1), 16);
            if (i >= 0 && i < 65536) {
                return String.fromCharCode(i);
            } else {
                return match;
            }
        }
        if (/&#[0-9]+;/.test(match)) {
            const i = parseInt(match.substring(2, match.length - 1), 10);
            if (i >= 0 && i < 65536) {
                return String.fromCharCode(i);
            } else {
                return match;
            }
        }

        // Character entity reference
        switch (match) {
            case '&amp;': return '&';
            case '&apos;': return '\'';
            case '&quot;': return '"';
            case '&lt;': return '<';
            case '&gt;': return '>';
            case '&nbsp;': return ' ';
        }
        return match;
    });
}

/**
 * Attempts to fix malformed XML markup.
 *
 * This function is designed to only fix particular classes of errors found in
 * wild, specifically:
 *
 *  - SoundCloud's oEmbed response includes unescaped ampersands in
 *    attributes.
 *  - Vimeo's oEmbed response uses attribute value elision.
 *  - Facebook's oEmbed response includes unescaped ampersands in text contents.
 */
export function legalizeXML(
    xml: string,
    onwarning?: (message: string) => void,
): string {
    const parts = xml.split(/(<[^\s>]+)([^>]*)(>)/);
    for (let i = 2; i < parts.length; i += 4) {
        if (parts[i] !== '') {
            parts[i] = legalizeAttributes(parts[i], [], onwarning);
        }
    }
    for (let i = 0; i < parts.length; i += 4) {
        if (/[&<>]/.test(parts[i])) {
            parts[i] = escapeXmlText(unescapeXmlText(parts[i]));
        }
    }
    return parts.join('');
}