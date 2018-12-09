import {transformHtmlWith} from './dom';
import {removePrefix} from './utils';
import {replaceTables} from './mftext-table';

const MFTEXT_TAG_NAME = 'mf-text';

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

const FENCE_REGEX = /([ \t]*)(~{3,}|`{3,})\s*([-_0-9a-zA-Z\s]*)$/;

const PHRASING_ELEMENTS = [
    'mf-ph', // default placeholder for non-element nodes
    'mf-eq',
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
    'code', 'mf-code', 'svg', 'mf-eq', 'mf-eq-display'
];
const VERBATIM_ELEMENTS_MAP = new Map(VERBATIM_ELEMENTS.map(
    (n): [string, boolean] => [n, true]
));

/**
 * Expands all `<mf-text>` in a given DOM node.
 */
export function expandMfText(node: Element): void {
    if (node.tagName.toLowerCase() !== MFTEXT_TAG_NAME) {
        for (let n: Node | null = node.firstChild; n; n = n.nextSibling) {
            if (n instanceof Element) {
                expandMfText(n);
            }
        }
        return;
    }

    // TODO: Replace diagrams

    // Fenced code blocks
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
                if (matches && matches[2] === currentCodeBlockFence) {
                    if (output[output.length - 1] === '\n') {
                        output.pop(); // Remove trailing newline
                    }
                    if (matches[3] === '') {
                        // End of code blocks
                        output.push('</mf-code></mf-codeblock>\n');
                        inCodeBlock = false;
                    } else {
                        // Language switch
                        output.push(`</mf-code><mf-code type="${matches[3]}">`);
                        output.push('\n');
                        currentCodeBlockIndentation = matches[1];
                    }
                } else {
                    output.push(removePrefix(line, currentCodeBlockIndentation));
                    output.push('\n');
                }
            } else {
                if (matches) {
                    output.push('<mf-codeblock>');
                    output.push(`<mf-code type="${matches[3]}">`);
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
            output.push('</mf-code></mf-codeblock>');
            output.push('<mf-error>Unclosed fenced code block/mf-error>');
        } else {
            output.pop(); // Remove trailing newline
        }

        return output.join('');
    });

    // Inline code
    transformHtmlWith(node, html => html.replace(
        /`(.+?(?:\n.+?)?)`(?!\d)/g, '<code>$1</code>',
    ));

    // Parse HTML comments
    transformHtmlWith(node, html => html.replace(
        /&lt;(!--\s[\s\S]*?--)&gt;/g,
        (_, inner) => `<${inner}>`,
    ));

    // TODO: Replace well-formed HTML tags

    // LaTeX display equations
    transformHtmlWith(node, html => html.replace(
        /\$\$(.*?)\$\$/g,
        '<mf-eq-display>$1</mf-eq-display>',
    ));
    transformHtmlWith(node, html => html.replace(
        /\\begin{(equation\*?|eqnarray)}.*?\\end{\1}/g,
        '<mf-eq-display>$&</mf-eq-display>',
    ));

    // LaTeX inline equations
    transformHtmlWith(node, html => html.replace(
        /((?:[^\w\d]))\$(\S(?:[^\$]*?\S(?!US|Can))??)\$(?![\w\d])/g,
        '$1<mf-eq>$2</mf-eq>',
    ));
    transformHtmlWith(node, html => html.replace(
        /((?:[^\w\d]))\$([ \t][^\$]+?[ \t])\$(?![\w\d])/g,
        '$1<mf-eq>$2</mf-eq>',
    ));

    // Headings
    transformHtmlWith(node, html => html.replace(
        /(?:^|\s*\n)(.+?)\n[ \t]*={3,}[ \t]*\n/g,
        (_, inner) => `<h1>${inner}</h1>`,
    ));
    transformHtmlWith(node, html => html.replace(
        /(?:^|\s*\n)(.+?)\n[ \t]*-{3,}[ \t]*\n/g,
        (_, inner) => `<h2>${inner}</h2>`,
    ));
    for (let i = 6; i >= 1; --i) {
        // ATX-style header (`## h2`)
        transformHtmlWith(node, html => html.replace(
            new RegExp(`^\s*#{${i},${i}}(?:[ \t])([^\n#]+)#*[ \t]*\n`, 'gm'),
            (_, inner) => `<h${i}>${inner}</h${i}>`,
        ));
    }

    // Tables
    transformHtmlWith(node, replaceTables);

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
                    if (match[1] !== 'mf-ph' && match[1] !== 'MF-PH') {
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

        if (output[output.length - 1] === '\n') {
            output.pop(); // Remove trailing newline
        }

        return output.join('');
    });

    const isNonVerbatimElement = (e: Element) =>
        !VERBATIM_ELEMENTS_MAP.has(e.tagName.toLowerCase())

    // TODO: Replace definition lists

    // TODO: Replace headers

    // TODO: Replace media

    // TODO: Replace hyperlinks

    // TODO: Replace admonitions

    // TODO: Replace footnotes/endnotes

    transformHtmlWith(node, html => {
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
    }, isNonVerbatimElement);

    // Strikethrough
    transformHtmlWith(node, html => html.replace(
        /~~(.*?)~~/g, '<del>$1</del>',
    ), isNonVerbatimElement);

    // Boldfaces
    transformHtmlWith(node, html => html.replace(
        /\*\*(.*?)\*\*/g, '<b>$1</b>',
    ), isNonVerbatimElement);
    transformHtmlWith(node, html => html.replace(
        /__(.*?)__/g, '<b>$1</b>',
    ), isNonVerbatimElement);

    // Italics
    transformHtmlWith(node, html => html.replace(
        /\*(.*?)\*/g, '<i>$1</i>',
    ), isNonVerbatimElement);
    transformHtmlWith(node, html => html.replace(
        /_(.*?)_/g, '<i>$1</i>',
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
        const title = node.ownerDocument!.createElement('mf-title');
        for (let n: Node | null = bold.firstChild; n; ) {
            const next = n.nextSibling;
            title.appendChild(n);
            n = next;
        }
        firstPara.parentElement!.insertBefore(title, firstPara);
        firstPara.parentElement!.removeChild(firstPara);

        // If there are remaining contents, put them in `<mf-lead>...</mf-lead>`
        const lead = node.ownerDocument!.createElement('mf-lead');
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
}
