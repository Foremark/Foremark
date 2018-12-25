import {decodeHTML} from 'entities';

import {TagNames} from '../foremark';
import {
    transformHtmlWith, escapeXmlText, legalizeAttributes, InternalTagNames,
    transformTextNodeWith, forEachNodePreorder,
} from '../utils/dom';
import {removePrefix} from '../utils/string';
import {replaceTables} from './table';
import {replaceBlocks} from './blocks';
import {
    FIGURE_ID_RE, ENDNOTE_ID_RE, TextInternalTagNames, FLOATING_SIZE_RE,
    MEDIA_PARAM_RE,
} from './common';

const ARROWS: [string, string][] = [
    ['&lt;==', '⇐'],
    ['-&gt;', '→'],
    ['--&gt;', '⟶'],
    ['==&gt;', '⇒'],
    ['&lt;-', '←'],
    ['&lt;--', '⟵'],
    ['&lt;==&gt;', '⇔'],
    ['&lt;-&gt;', '↔'],
];
const ARROWS_MAP = new Map(ARROWS);
const ARROWS_REGEX = new RegExp(
    '(\\s|^)(' + ARROWS.map(e => e[0]).join('|') + ')(?=\\s)',
    'g',
);

const FENCE_REGEX = /^((?:[ \t]|&gt;)*)(~{3,}|`{3,})\s*([-_0-9a-zA-Z\s]*)$/;

const DIAGRAM_REGEX = /^((?:[ \t]|&gt;)*):::(.*)$/;

const PHRASING_ELEMENTS = [
    InternalTagNames.Placeholder, // default placeholder for non-element nodes
    TagNames.Ref,
    TagNames.Equation,
    'addr', 'audio', 'b', 'bdo', 'br', 'button', 'canvas', 'cite', 'code',
    'command', 'data', 'datalist', 'dfn', 'em', 'embed', 'i', 'iframe', 'img',
    'input', 'kbd', 'keygen', 'label', 'mark', 'math', 'meter', 'noscript',
    'object', 'output', 'progress', 'q', 'ruby', 'samp', 'script', 'select',
    'small', 'span', 'strong', 'sub', 'sup', 'svg', 'textarea', 'time', 'var',
    'video', 'wbr',
    // The following elements are conditional, but we assume they belong to
    // this category
    'a', 'del', 'ins',
];
const PHRASING_ELEMENTS_MAP = new Map(PHRASING_ELEMENTS.map(
    (n): [string, boolean] => [n, true]
));

const VERBATIM_ELEMENTS = [
    'code', TagNames.Code, 'svg', TagNames.Equation, TagNames.DisplayEquation,
    TextInternalTagNames.LinkTarget, TagNames.Diagram,
];
const VERBATIM_ELEMENTS_MAP = new Map(VERBATIM_ELEMENTS.map(
    (n): [string, boolean] => [n, true]
));

/**
 * Expands all `<mf-text>` in a given DOM node.
 */
export function expandMfText(node: Element): void {
    if (node.tagName.toLowerCase() !== TagNames.Text) {
        for (let n: Node | null = node.firstChild; n; n = n.nextSibling) {
            if (n instanceof Element) {
                expandMfText(n);
            }
        }
        return;
    }

    // Merge consecutive text nodes
    //
    // Without this step, constructs spanning across multiple text nodes are
    // not recognized properly. For example, "`]]><![CDATA[]>][`" inside CDATA
    // (which is intended to display a code fragment "]]>") splits the current
    // CDATA section into two: one ending with "`]" and one starting with
    // "]>`". `transformTextNodeWith` calls a supplied function in
    // per text node basis, so this example won't be recognized as a hyperlink
    // without this step.
    forEachNodePreorder(node, node => {
        if (!(node instanceof Text) || node.nextSibling instanceof Text) {
            return;
        }
        // This is the last one of one or more consecutive text nodes.
        if (!(node.previousSibling instanceof Text)) {
            // One consecutive text node.
            return;
        }

        // Merge all and remove all but the last one.
        const parts: string[] = [node.textContent!];
        const parent = node.parentElement!;

        for (let n: Node | null = node.previousSibling; n instanceof Text; ) {
            const next: Node | null = n.previousSibling;
            parts.unshift(n.textContent!);
            parent.removeChild(n);
            n = next;
        }

        node.textContent = parts.join('');
    });

    // Fenced code blocks
    //
    // This step preserves the indentation of code blocks. For example:
    //
    //     >  ~~~~~~~~~~~~~~~~
    //     >  code...
    //     >  ~~~~~~~~~~~~~~~~
    //
    // will be:
    //
    //     >  <mf-code-block><mf-code>code...</mf-code></mf-code-block>
    //
    transformHtmlWith(node, html => {
        const lines = html.split('\n');
        const output: string[] = [];

        let inCodeBlock = false;
        let currentCodeBlockIndentation = '';
        let currentCodeBlockFence = '';

        for (const line of lines) {
            const matches = line.match(FENCE_REGEX);

            if (matches) {
                matches[2] = matches[2].substr(0, 1);
                matches[3] = matches[3].trim();
            }

            if (inCodeBlock) {
                if (matches &&
                    matches[2] === currentCodeBlockFence &&
                    matches[1] === currentCodeBlockIndentation
                ) {
                    if (output[output.length - 1] === '\n') {
                        output.pop(); // Remove trailing newline
                    }
                    if (matches[3] === '') {
                        // End of code blocks
                        output.push(`</${TagNames.Code}></${TagNames.CodeBlock}>\n`);
                        inCodeBlock = false;
                    } else {
                        // Language switch
                        output.push(`</${TagNames.Code}><${TagNames.Code} type="${matches[3]}">`);
                        output.push('\n');
                        currentCodeBlockIndentation = matches[1];
                    }
                } else {
                    output.push(removePrefix(line, currentCodeBlockIndentation));
                    output.push('\n');
                }
            } else {
                if (matches) {
                    output.push(matches[1]); // Preserve indentation
                    output.push(`<${TagNames.CodeBlock}>`);
                    output.push(`<${TagNames.Code} type="${matches[3]}">`);
                    inCodeBlock = true;
                    currentCodeBlockFence = matches[2];
                    currentCodeBlockIndentation = matches[1];
                } else {
                    output.push(line);
                    output.push('\n');
                }
            }
        }

        if (inCodeBlock) {
            if (output[output.length - 1] === '\n') {
                output.pop(); // Remove trailing newline
            }
            output.push(`</${TagNames.Code}></${TagNames.CodeBlock}>`);
            output.push(`<${TagNames.Error}>Unclosed fenced code block</${TagNames.Error}>`);
        } else {
            output.pop(); // Remove trailing newline
        }

        return output.join('');
    });

    // Diagrams
    //
    // This step preserves the indentation of code blocks. For example:
    //
    //     >  ::: code...
    //     >  ::: code...
    //
    // will be:
    //
    //     >  <mf-diagram>...</mf-diagram>
    //
    transformHtmlWith(node, html => {
        const lines = html.split('\n');
        const output: string[] = [];

        let inDiagram = false;
        let currentDiagramIndentation = '';

        for (const line of lines) {
            const matches = line.match(DIAGRAM_REGEX);

            if (inDiagram) {
                if (!matches || matches[1] !== currentDiagramIndentation) {
                    if (output[output.length - 1] === '\n') {
                        output.pop(); // Remove trailing newline
                    }
                    output.push(`</${TagNames.Diagram}>\n`);
                    inDiagram = false;
                } else {
                    output.push(matches[2]);
                    output.push('\n');
                }
            }

            if (!inDiagram) {
                if (matches) {
                    output.push(matches[1]); // Preserve indentation
                    output.push(`<${TagNames.Diagram}>`);
                    output.push(matches[2]);
                    output.push('\n');
                    inDiagram = true;
                    currentDiagramIndentation = matches[1];
                } else {
                    output.push(line);
                    output.push('\n');
                }
            }
        }

        if (inDiagram) {
            if (output[output.length - 1] === '\n') {
                output.pop(); // Remove trailing newline
            }
            output.push(`</${TagNames.Diagram}>`);
        } else {
            output.pop(); // Remove trailing newline
        }

        return output.join('');
    });

    // Block quotations
    const BLOCKQUOTE_LINE_RE = /&gt;.*(?:\n(?!&gt;).*\S+.*$)*/.source;
    const BLOCKQUOTE_RE = new RegExp(
        `^${BLOCKQUOTE_LINE_RE}(\n${BLOCKQUOTE_LINE_RE})*`,
        'gm',
    );
    const replaceSingleLevelBlockquote = (html: string): string => ('\n' + html)
        // Replace the top-level blockquotes in this level
        .replace(
            BLOCKQUOTE_RE,
            bq => '<blockquote>' + replaceSingleLevelBlockquote(
                bq.replace(/^[ \t]*&gt;[ \t]*/gm, '')
            ) + '</blockquote>',
        ).substr(1);
    transformHtmlWith(node, replaceSingleLevelBlockquote);

    const isBlockquote = (e: Element) => e.tagName === 'blockquote';

    // Inline code
    transformTextNodeWith(node, html => html.replace(
        /`(.+?(?:\n.+?)?)`(?!\d)/g, '<code>$1</code>',
    ), e => e === node || isBlockquote(e), false);

    // Parse HTML comments
    transformTextNodeWith(node, html => html.replace(
        /&lt;(!--\s[\s\S]*?--)&gt;/g,
        (_, inner) => `<${inner}>`,
    ), e => e === node || isBlockquote(e), false);

    // Replace well-formed HTML tags
    // The regex performs all validation of individual tags. The code checks
    // if opening tags are matched by closing tags.
    const ident = '[a-z][-a-z0-9]*';
    const permittedEntities = 'amp|quot|lt|gt';
    const tagRE = new RegExp(
        `(&lt;` +
        `(?:(${ident})(?:\\s+${ident}="(?:[^"<>&]|&amp;${permittedEntities};)*")*` +
        //   ^^^^^^^^
        //   $2 opening tag name
        `\\s*/?|` +
        //  ^^
        // self-closing
        `/(${ident}))&gt;)`,
        // ^^^^^^^^
        // $3 closing tag name
        'g',
     );
    transformHtmlWith(node, html => {
        const output: string[] = [];

        /// A stack tracking unvalidated opening tags.
        const stack: [string, number][] = [];

        const parts = html.split(tagRE);
        output.push(parts[0]);

        for (let i = 1; i < parts.length; i += 4) {
            const tag = parts[i];
            const openingTagName = parts[i + 1];
            const closingTagName = parts[i + 2];
            const post = parts[i + 3];

            if (closingTagName) {
                // `</a>`
                let i = stack.length;
                while (i > 0 && stack[i - 1][0] !== closingTagName) {
                    i--;
                }

                if (i > 0) {
                    // Found a matching opening tag. Materialize the opening tag,
                    // and forget about potential opening tags (`stack[i..]`)
                    // which turned out to have no closing tags.
                    while (stack.length > i) {
                        stack.pop();
                    }
                    const e = stack.pop()!; // `stack[i - 1]`

                    output[e[1]] = decodeHTML(output[e[1]]);
                    output.push(decodeHTML(tag));
                } else {
                    // A matching opening tag wasn't found.
                    output.push(tag);
                }
            } else if (tag.endsWith('/&gt;')) {
                // `<a />`
                output.push(decodeHTML(tag));
            } else {
                // `<a>`
                stack.push([openingTagName, output.length]);
                output.push(tag);
            }

            output.push(post);
        }

        return output.join('');
    }, isBlockquote);

    // LaTeX display equations
    transformTextNodeWith(node, html => html.replace(
        /\$\$([^<>]*?)\$\$/g,
        `<${TagNames.DisplayEquation}>$1</${TagNames.DisplayEquation}>`,
    ), e => e === node || isBlockquote(e), false);
    transformTextNodeWith(node, html => html.replace(
        /\\begin{(equation\*?|eqnarray)}[^<>]*?\\end{\1}/g,
        `<${TagNames.DisplayEquation}>$&</${TagNames.DisplayEquation}>`,
    ), e => e === node || isBlockquote(e), false);

    // LaTeX inline equations
    transformTextNodeWith(node, html => html.replace(
        /((?:[^\w\d]))\$(\S(?:[^\$]*?\S(?!US|Can))??)\$(?![\w\d])/g,
        `$1<${TagNames.Equation}>$2</${TagNames.Equation}>`,
    ), e => e === node || isBlockquote(e), false);
    transformTextNodeWith(node, html => html.replace(
        /((?:[^\w\d]))\$([ \t][^\$]+?[ \t])\$(?![\w\d])/g,
        `$1<${TagNames.Equation}>$2</${TagNames.Equation}>`,
    ), e => e === node || isBlockquote(e), false);

    // Headings
    transformHtmlWith(node, html => html.replace(
        /^(.+?)\n[ \t]*={3,}[ \t]*$/gm,
        (_, inner) => `<h1>${inner}</h1>`,
    ), isBlockquote);
    transformHtmlWith(node, html => html.replace(
        /^(.+?)\n[ \t]*-{3,}[ \t]*$/gm,
        (_, inner) => `<h2>${inner}</h2>`,
    ), isBlockquote);
    for (let i = 6; i >= 1; --i) {
        // ATX-style header (`## h2`)
        transformHtmlWith(node, html => html.replace(
            new RegExp(`^\s*#{${i},${i}}(?:[ \t])([^\n#]+)#*[ \t]*\n`, 'gm'),
            (_, inner) => `<h${i}>${inner}</h${i}>`,
        ), isBlockquote);
    }

    // Horizontal rule: `* * *`, `- - -`, `_ _ _`
    transformHtmlWith(node, html => html.replace(
        /^[ \t]*((\*|-|_)[ \t]*){3,}[ \t]*$/gm,
        '<hr />',
    ), isBlockquote);

    // Nestable block elements
    //  - `<ul>`, `<ol>`, `<dl>`
    //  - `<mf-admonition>`
    transformHtmlWith(node, replaceBlocks, isBlockquote);

    const isBlock = (e: Element) => {
        const {tagName} = e;
        return tagName === TagNames.Admonition ||
            tagName === TagNames.Figure ||
            tagName === TagNames.Note ||
            tagName === TagNames.Block ||
            tagName.match(/^(?:ul|ol|dl|li|dt|dd|blockquote)$/i) != null;
    };

    // Tables
    transformHtmlWith(node, replaceTables, isBlock);

    // Paragraphs
    transformHtmlWith(node, html => {
        const TAG = /<([-_a-zA-Z0-9]+)\s+.*?>/g;

        const lines = html.split('\n');
        const output: string[] = [];

        let inParagraph = false;

        for (let line of lines) {
            if (line.length === 0) {
                // Empty line - insert a paragraph break
                if (inParagraph) {
                    output.push('</p>');
                    output.push('\n');
                    inParagraph = false;
                }
            }
            while (line.length > 0) {
                // Non-phrasing element terminates the current paragraph
                let until = -1;
                let restartFrom = 0;
                let foundVisualElement = false;

                TAG.lastIndex = 0;
                let match: ArrayLike<string> | null;
                while ((match = TAG.exec(line)) !== null) {
                    until = TAG.lastIndex - match[0].length;
                    if (until > restartFrom) {
                        // A text node was found
                        foundVisualElement = true;
                    }
                    restartFrom = TAG.lastIndex;
                    if (!PHRASING_ELEMENTS_MAP.has(match[1].toLowerCase())) {
                        // Non-phrasing element found - stop right here
                        break;
                    }
                    if (match[1] !== InternalTagNames.Placeholder) {
                        // Element possibly including a text node was found
                        foundVisualElement = true;
                    }
                }
                if (match === null) {
                    if (line.length > restartFrom) {
                        foundVisualElement = true;
                    }
                    until = line.length;
                    restartFrom = -1;
                }

                // A part of the current line to be included in the current paragraph
                const cur = line.substr(0, until).trim();

                if (cur !== '') {
                    // Do not start a paragraph if we only encountered non-visual
                    // nodes such as comments
                    if (foundVisualElement && !inParagraph) {
                        // Start a paragraph
                        output.push('<p>');
                        output.push('\n');
                        inParagraph = true;
                    }
                    output.push(cur);
                    output.push('\n');
                }

                // Processs the rest of the line
                if (restartFrom >= 0) {
                    if (inParagraph) {
                        output.push('</p>');
                        output.push('\n');
                        inParagraph = false;
                    }

                    output.push(line.substring(until, restartFrom));
                    output.push('\n');

                    line = line.substr(restartFrom);
                } else {
                    break;
                }
            }
        }

        if (inParagraph) {
            output.push('</p>');
        }

        if (output[output.length - 1] === '\n') {
            output.pop(); // Remove trailing newline
        }

        return output.join('');
    }, isBlock);

    const isNonVerbatimElement = (e: Element) =>
        !VERBATIM_ELEMENTS_MAP.has(e.tagName.toLowerCase());

    const isNonVerbatimElementAndNotLink = (e: Element) =>
        isNonVerbatimElement(e) && e.tagName !== 'a';

    // Reference to a figure or endnote: `[^link]`
    transformHtmlWith(node, html => html.replace(
        new RegExp(`\\[${FLOATING_SIZE_RE.source}(${ENDNOTE_ID_RE.source}|${FIGURE_ID_RE.source})\\]`, 'g'),
        (_, id) => {
            id = decodeHTML(id);
            return `<${TagNames.Ref} to="${escapeXmlText(id)}" />`;
        }
    ), isNonVerbatimElement);

    // Hyperlink: `[text](url)`
    transformHtmlWith(node, html => html.replace(
        /(^|[^!])\[([^\[\]]+?)\]\(("?)([^<>\s"]+?)\3(\s+[^\)]*?)?\)/g,
        (match, pre, text, maybeQuote, url: string, attribs = '') => {
            url = escapeXmlText(url);
            attribs = legalizeAttributes(attribs, ['href'], e => console.warn(e));
            return pre + `<a href="${url}"${attribs}>${text}</a>`;
        }
    ), isNonVerbatimElement);

    // Inline media: `![text](url)`
    transformHtmlWith(node, html => html.replace(
        new RegExp(`!\\[([^\\[\\]]*)\]\\s*\\(${MEDIA_PARAM_RE.source}\\)`, 'g'),
        (_, altRaw, urlRaw, attribsRaw = '') => {
            if (urlRaw.startsWith('"')) {
                urlRaw = urlRaw.substring(1, urlRaw.length - 1);
            }

            const alt = decodeHTML(altRaw);
            const url = decodeHTML(urlRaw), attribs = decodeHTML(attribsRaw);

            return `<img src="${escapeXmlText(url)}" alt="${escapeXmlText(alt)}"` +
                `${legalizeAttributes(attribs, ['src', 'alt'], m => console.warn(m))} />`;
        }
    ), isNonVerbatimElement);

    // Symbolic hyperlink: `[text][linkname]` `![alt][linkname]`
    const linkSymbolTable = new Map<string, string>();
    transformTextNodeWith(
        node,
        html => {
            if (linkSymbolTable.size === 0) {
                return html;
            }

            // Can't use `String#replace` here because it only scans a string in
            // the forward direction.
            const parts = html.split(/((!)?\[([^\]]+)\]\[([^\^#!<>[\]][^<>[\]]*)?\])/g);
            //                          ^     ^^^^^^      ^^^^^^^^^^^^^^^^^^^^
            //                        image?   text        symbol name
            if (parts.length === 1) {
                return html;
            }

            const output: string[] = [];
            output.unshift(parts.pop()!);
            for (let i = parts.length; i > 0; i -= 5) {
                const pre = parts[i - 5];
                const source = parts[i - 4];
                const isImage = parts[i - 3];
                const text = parts[i - 2];
                let symbolName = parts[i - 1];

                if (symbolName == null) {
                    symbolName = text;
                }

                let linkTarget = linkSymbolTable.get(symbolName);
                if (linkTarget != null) {
                    linkSymbolTable.delete(symbolName);

                    linkTarget = linkTarget.trim();
                    if (isImage) {
                        const match = linkTarget.match(/^(?:(")?([^"]*)\1)( .*)?$/);
                        if (match) {
                            let [_1, _2, url, attribs] = match;
                            attribs = legalizeAttributes(attribs || '', ['src', 'alt'], e => console.warn(e));
                            output.unshift(`<img src="${escapeXmlText(url)}" alt="${escapeXmlText(text)}"${attribs} />`);
                        } else {
                            output.unshift(`<${TagNames.Error}>Failed to parse the link target: <code>` +
                                escapeXmlText(linkTarget) +
                                `</code></${TagNames.Error}>`);
                        }
                    } else {
                        output.unshift(`<a href="${escapeXmlText(linkTarget)}">${text}</a>`);
                    }
                } else {
                    // Link target wasn't found; treat the fragment as a normal text
                    output.unshift(source);
                }

                output.unshift(pre);
            }

            return output.join('');
        }, element => {
            if (element.tagName === TextInternalTagNames.LinkTarget) {
                const symbolName = element.getAttribute('link-id')!;
                const linkTarget = element.textContent!.replace(/[\r\n]/g, '');
                linkSymbolTable.set(symbolName, linkTarget);

                // Consume `<TextInternalTagNames.LinkTarget>`
                element.parentElement!.removeChild(element);

                return false;
            }
            return isNonVerbatimElementAndNotLink(element);
        },
        // Traverse in the reverse order so that
        true,
    );

    // TODO: Replace other types of hyperlinks
    //       `<url>`, `http://example.com`, `USER@example.com`, `[#citeref]`

    transformTextNodeWith(node, html => {
        // Arrows
        html = html.replace(
            ARROWS_REGEX,
            (_, start, arrow) => start + ARROWS_MAP.get(arrow),
        );

        // Em dash: `---`
        html = html.replace(/\b---\b/g, '—');

        // En dash: `--`
        html = html.replace(/\b--\b/g, '–');

        // Number x number
        html = html.replace(/\b(\d+\s?)x(\s?\d+)\b/g, '$1×$2');

        return html;
    }, isNonVerbatimElement, false);

    // Strikethrough
    transformHtmlWith(node, html => html.replace(
        /~~([^]+?)~~/g, '<del>$1</del>',
    ), isNonVerbatimElement);

    // Boldfaces
    transformHtmlWith(node, html => html.replace(
        /\*\*([^]+?)\*\*/g, '<b>$1</b>',
    ), isNonVerbatimElement);
    transformHtmlWith(node, html => html.replace(
        /__([^]+?)__/g, '<b>$1</b>',
    ), isNonVerbatimElement);

    // Italics
    transformHtmlWith(node, html => html.replace(
        /\*([^]+?)\*/g, '<i>$1</i>',
    ), isNonVerbatimElement);
    transformHtmlWith(node, html => html.replace(
        /_([^]+?)_/g, '<i>$1</i>',
    ), isNonVerbatimElement);

    // The first paragraph starting with `<b>...</b>` is treated as title
    (() => {
        const firstPara = node.getElementsByTagName('p')[0];
        if (!firstPara) {
            return;
        }
        let bold: Element | null = null;
        for (let n: Node | null = firstPara.firstChild; n; n = n!.nextSibling) {
            if ((n instanceof Text) && n.textContent!.match(/^\s*$/)) {
                continue;
            }
            if (!(n instanceof Element) || (n.tagName !== 'B' && n.tagName !== 'b')) {
                return;
            }
            bold = n;
            break;
        }
        if (!bold) {
            return;
        }

        // Replace `<p><b>...</b></p>` with `<mf-title>...</mf-title>`
        const title = node.ownerDocument!.createElement(TagNames.Title);
        for (let n: Node | null = bold.firstChild; n; ) {
            const next = n.nextSibling;
            title.appendChild(n);
            n = next;
        }
        firstPara.parentElement!.insertBefore(title, firstPara);
        firstPara.parentElement!.removeChild(firstPara);

        // If there are remaining contents, put them in `<mf-lead>...</mf-lead>`
        const lead = node.ownerDocument!.createElement(TagNames.Lead);
        let isEmpty = true;
        for (let n: Node | null = bold.nextSibling; n; ) {
            if (!(n instanceof Text) || !n.textContent!.match(/^\s*$/)) {
                isEmpty = false;
            }

            const next = n.nextSibling;
            lead.appendChild(n);
            n = next;
        }
        if (isEmpty) {
            return;
        }
        title.parentElement!.insertBefore(lead, title.nextSibling);
    })();

    // Unwrap `<mf-text>`
    const parent = node.parentElement;
    if (!parent) {
        throw new Error(`${TagNames.Text} must bave a parent element.`);
    }
    while (node.firstChild) {
        parent.insertBefore(node.firstChild, node);
    }
    parent.removeChild(node);
}
