import {transformHtmlWith} from './dom';

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

    // TODO: Replace obvious HTML tags (such as comments)

    // TODO: Replace diagrams

    // TODO: Replace code blocks

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
