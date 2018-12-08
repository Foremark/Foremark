import {transformHtmlWith} from './dom';
import {removePrefix} from './utils';

const MFTEXT_TAG_NAME = 'mf-text';

const ARROWS: [string, string][] = [
    ['<==', '\u21D0'],
    ['->', '&rarr;'],
    ['-->', '&xrarr;'],
    ['==>', '\u21D2'],
    ['<-', '&larr;'],
    ['<--', '&xlarr;'],
    ['<==>', '\u21D4'],
    ['<->', '\u2194'],
];
const ARROWS_MAP = new Map(ARROWS);
const ARROWS_REGEX = new RegExp(
    '(\\s|^)(' + ARROWS.map(e => e[0]).join('|') + ')(?=\\s)',
    'g',
);

const FENCE_REGEX = /([ \t]*)(~{3,}|`{3,})\s*([-_0-9a-zA-Z\s]*)$/;

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
                        output.pop(); // Remove trailing newline
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

    // TODO: Replace LaTeX blocks

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
    });

    // Strikethrough
    transformHtmlWith(node, html => html.replace(
        /~~(.*?)~~/, '<del>$1</del>',
    ));

    // Boldfaces
    transformHtmlWith(node, html => html.replace(
        /\*\*(.*?)\*\*/, '<b>$1</b>',
    ));
    transformHtmlWith(node, html => html.replace(
        /__(.*?)__/, '<b>$1</b>',
    ));

    // Italics
    transformHtmlWith(node, html => html.replace(
        /\*(.*?)\*/, '<i>$1</i>',
    ));
    transformHtmlWith(node, html => html.replace(
        /_(.*?)_/, '<i>$1</i>',
    ));
}
