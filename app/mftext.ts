import {transformHtmlWith} from './dom';
import {removePrefix} from './utils';

const MFTEXT_TAG_NAME = 'mf-text';

const ARROWS: [string, string][] = [
    ['&lt;==', '\u21D0'],
    ['-&gt;', '&rarr;'],
    ['--&gt;', '&xrarr;'],
    ['==&gt;', '\u21D2'],
    ['&lt;-', '&larr;'],
    ['&lt;--', '&xlarr;'],
    ['&lt;==&gt;', '\u21D4'],
    ['&lt;-&gt;', '\u2194'],
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

    // Paragraphs
    transformHtmlWith(node, html => {
        const TAG = /<([-_a-zA-Z0-9]+)\s+.*?>/g;

        const lines = html.split('\n');
        const output: string[] = [];

        let inParagraph = false;

        for (let line of lines) {
            while (line.length > 0) {
                // Non-phrasing element terminates the current paragraph
                let until = -1;
                let restartFrom = -1;

                TAG.lastIndex = 0;
                let match: ArrayLike<string> | null;
                while ((match = TAG.exec(line)) !== null) {
                    until = TAG.lastIndex - match[0].length;
                    restartFrom = TAG.lastIndex;
                    if (!PHRASING_ELEMENTS_MAP.has(match[1].toLowerCase())) {
                        // Non-phrasing element found - stop right here
                        break;
                    }
                }
                if (match === null) {
                    until = line.length;
                    restartFrom = -1;
                }

                // A part of the current line to be included in the current paragraph
                const cur = line.substr(0, until).trim();

                if (cur === '') {
                    // Empty line - insert a paragraph break
                    if (inParagraph) {
                        output.push('</p>');
                        output.push('\n');
                        inParagraph = false;
                    }
                } else {
                    if (!inParagraph) {
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
        !VERBATIM_ELEMENTS_MAP.has(e.tagName)

    // TODO: Replace tables

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
        html = html.replace(/\b(\d+\s?)x(\s?\d+)\b/g, '$1&imes;$2');

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
}
