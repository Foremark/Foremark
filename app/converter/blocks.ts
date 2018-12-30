import {TagNames} from '../foremark';
import {
    TextInternalTagNames, ENDNOTE_ID_RE, FIGURE_ID_RE, MEDIA_PARAM_RE,
    FLOATING_SIZE_RE, parseFloatingSize,
} from './common';
import {removePrefix, analyzeIndent, IndentCommand} from '../utils/string';
import {
    escapeXmlText, legalizeAttributes, TransformHtmlWithContext,
    unescapeXmlText,
} from '../utils/dom';

interface Level {
    /**
     * The indentation of the previous level (which is equal to that of the
     * line that started this level).
     */
    originalIndentation: string;

    /**
     * The indentation of the contents. `null` if unknown.
     */
    bodyIndentation: string | null;

    state: BlockState;
}

interface BlockMarkerTraits {
    readonly captionStyle?: CaptionStyle;
}

const enum CaptionStyle {
    None,

    /** A marker takes the preceding line as the caption text. */
    PrecedingLine,

    /** A marker takes the rest of the current line as the caption text. */
    SameLine,
}

interface BlockInitiator extends BlockMarkerTraits {
    /**
     * The regex that can be used as a marker text for this `BlockInitiator`.
     */
    readonly markerPattern: RegExp;

    /**
     * Constructs a `BlockState` given a marker text (like `451.` or `- [x]`).
     *
     * Returns the constructed `BlockState` and a HTML fragment.
     */
    start(marker: string, caption: string | null, ctx: TransformHtmlWithContext): [BlockState, string];
}

interface BlockState extends BlockMarkerTraits {
    /**
     * Returns whether this block can assimilate a given marker as a new item.
     *
     * If this returns false, this block will be closed and a new block will be
     * created.
     */
    canContinue(marker: string): boolean;

    /**
     * Emits a HTML fragment that generates another item of this block.
     */
    continue(marker: string, caption: string | null, ctx: TransformHtmlWithContext): string;

    /**
     * Emits a HTML fragment that close this block.
     */
    close(): string;
}

/** Represents the top-level block state. */
const TopLevel: BlockState = {
    canContinue: () => { return false; },
    continue: () => { throw new Error(); },
    close: () => { throw new Error(); },
};

/**
 * `BlockInitiator`/`BlockState` for unordered lists.
 */
const UnorderedList = {
    markerPattern: /(?:(?:-\s+)?\[[x ]\])|-|\+|\*/,

    start(marker: string, caption: string | null): [BlockState, string] {
        return [
            UnorderedList,
            `<ul><li class="${unorderedListMarkerToClass(marker)}">`,
        ];
    },

    canContinue(marker: string): boolean {
        return /^(?:(?:-\s+)?\[[x ]\]|-|\+|\*)$/.test(marker);
    },
    continue(marker: string, caption: string | null): string {
        return `</li><li class="${unorderedListMarkerToClass(marker)}">`;
    },
    close(): string {
        return '</li></ul>';
    },
};

function unorderedListMarkerToClass(marker: string): string {
    if (marker.indexOf('[x]') >= 0) {
        return 'checked';
    } else if (marker.indexOf('[ ]') >= 0) {
        return 'unchecked';
    }
    switch (marker) {
        case '-':
            return 'minus';
        case '+':
            return 'plus';
        case '*':
            return 'asterisk';
        default:
            throw new Error();
    }
}

/**
 * `BlockInitiator`/`BlockState` for ordered lists.
 */
class OrderedList implements BlockState {
    static markerPattern = /\d+\./;

    private constructor(private nextCounter: number) {}

    static start(marker: string, caption: string | null): [BlockState, string] {
        const i = parseInt(marker, 10);
        return [
            new OrderedList(i + 1),
            i == 1 ? `<ol><li>` : `<ol start="${i}"><li>`,
        ];
    }

    canContinue(marker: string): boolean {
        const i = parseInt(marker, 10);
        return i === this.nextCounter;
    }
    continue(marker: string, caption: string | null): string {
        this.nextCounter += 1;
        return `</li><li>`;
    }
    close(): string {
        return '</li></ol>';
    }
};

/**
 * `BlockInitiator`/`BlockState` for definition lists.
 */
const DefinitionList = {
    markerPattern: /:/,
    captionStyle: CaptionStyle.PrecedingLine,

    start(marker: string, caption: string | null): [BlockState, string] {
        return [
            DefinitionList,
            `<dl><dt>${caption}</dt><dd>`,
        ];
    },

    canContinue(marker: string): boolean {
        return marker === ':';
    },
    continue(marker: string, caption: string | null): string {
        return `</dd><dt>${caption}</dt><dd>`;
    },
    close(): string {
        return '</dd></dl>';
    },
};

/**
 * `BlockInitiator`/`BlockState` for admonitions.
 */
const Admonition = {
    markerPattern: /!!!/,
    captionStyle: CaptionStyle.SameLine,

    start(marker: string, caption: string | null): [BlockState, string] {
        const [_, type, title] = caption!.match(
            /^(?:([^:]+)(?::\s*|$))?(.*)/i)!;

        return [
            Admonition,
            `<${TagNames.Admonition} type="${(type || '').toLowerCase()}">` +
            (title != '' ? `<${TagNames.AdmonitionTitle}>${title}</${TagNames.AdmonitionTitle}>` : ''),
        ];
    },

    canContinue(marker: string): boolean { return false; },
    continue(marker: string, caption: string | null): string { throw new Error(); },
    close(): string { return `</${TagNames.Admonition}>`; },
};

/**
 * `BlockInitiator`/`BlockState` for link target definitons like `[linkname]: ...`.
 */
const LinkTargetDefinition = {
    // TODO: The content is verbatim (shouldn't be processed)
    markerPattern: new RegExp(/\[[^!^][^\][]*?\]:/),
    captionStyle: CaptionStyle.None,

    start(marker: string, caption: string | null, ctx: TransformHtmlWithContext): [BlockState, string] {
        const id = ctx.expand(marker.substring(1, marker.length - 2));

        return [
            LinkTargetDefinition,
            `<${TextInternalTagNames.LinkTarget} link-id="${escapeXmlText(id)}">`,
        ];
    },

    canContinue(marker: string): boolean { return false; },
    continue(marker: string, caption: string | null): string { throw new Error(); },
    close(): string { return `</${TextInternalTagNames.LinkTarget}>`; },
};

const endnotePattern = new RegExp(`\\[(${FLOATING_SIZE_RE.source})(${ENDNOTE_ID_RE.source})?\\]:`);

/**
 * `BlockInitiator`/`BlockState` for endnotes like `[^notename]: ...`.
 */
const Endnote = {
    markerPattern: new RegExp(endnotePattern.source.replace(/([^\\]|^)\(/g, '$1(?:')),
    captionStyle: CaptionStyle.None,

    start(marker: string, caption: string | null): [BlockState, string] {
        const [_, sizeRaw, idRaw  = ''] = endnotePattern.exec(marker)!;

        let size: string | null = parseFloatingSize(marker.substr(1, 1));
        size = size ? ` size="${size}"` : '';

        let id = unescapeXmlText(idRaw);

        // `id` is optional
        if (id !== '') {
            id = ` id="${escapeXmlText(id)}"`;
        }

        return [
            Endnote,
            `<${TagNames.Note}${id}${size}>`,
        ];
    },

    canContinue(marker: string): boolean { return false; },
    continue(marker: string, caption: string | null): string { throw new Error(); },
    close(): string { return `</${TagNames.Note}>`; },
};

const figurePattern = new RegExp(`\\[(${FLOATING_SIZE_RE.source})(${FIGURE_ID_RE.source})\\]:`);

/**
 * `BlockInitiator`/`BlockState` for endnotes like `[^Figure figid]: capture`.
 */
const Figure = {
    markerPattern: new RegExp(figurePattern.source.replace(/([^\\]|^)\(/g, '$1(?:')),
    captionStyle: CaptionStyle.SameLine,

    start(marker: string, caption: string | null): [BlockState, string] {
        const [_, sizeRaw, idRaw] = figurePattern.exec(marker)!;

        let size: string | null = parseFloatingSize(marker.substr(1, 1));
        size = size ? ` size="${size}"` : '';

        const id = unescapeXmlText(idRaw);

        return [
            Figure,
            `<${TagNames.Figure} id="${escapeXmlText(id)}"${size}>` +
            `<${TagNames.FigureCaption}>${caption}</${TagNames.FigureCaption}>`,
        ];
    },

    canContinue(marker: string): boolean { return false; },
    continue(marker: string, caption: string | null): string { throw new Error(); },
    close(): string { return `</${TagNames.Figure}>`; },
};

const imageBlockPattern = new RegExp(
    // `![^FigType basename]`
    `!\\[(${FLOATING_SIZE_RE.source})(${FIGURE_ID_RE.source})?\\]` +
    // `[alttext]`
    `\s*\\[([^\\]]*)\\]` +
    // `(URL attr...)`
    `\s*\\(${MEDIA_PARAM_RE.source}\\):`
);

/**
 * `BlockInitiator`/`BlockState` for image blocks.
 */
const ImageBlock = {
    markerPattern: new RegExp(imageBlockPattern.source.replace(/([^\\]|^)\(/g, '$1(?:')),

    start(marker: string, caption: string | null): [BlockState, string] {
        let [_, sizesym, idRaw = '', altRaw, urlRaw, attribsRaw = ''] = imageBlockPattern.exec(marker)!;
        let size: string | null = parseFloatingSize(sizesym);
        size = size ? ` size="${size}"` : '';

        if (urlRaw.startsWith('"')) {
            urlRaw = urlRaw.substring(1, urlRaw.length - 1);
        }

        let id = unescapeXmlText(idRaw);
        const alt = unescapeXmlText(altRaw);
        const url = unescapeXmlText(urlRaw), attribs = unescapeXmlText(attribsRaw);

        const img = `<p><${TagNames.Media} src="${escapeXmlText(url)}" alt="${escapeXmlText(alt)}"` +
            `${legalizeAttributes(attribs, ['src', 'alt'], e => console.warn(e))} /></p>`;

        if (id !== '') {
            id = ` id="${escapeXmlText(id)}"`;
        }

        return [
            ImageBlock,
            `<${TagNames.Figure}${id}${size}>` +
            img +
            `<${TagNames.FigureCaption}>`,
        ];
    },

    canContinue(marker: string): boolean { return false; },
    continue(marker: string, caption: string | null): string { throw new Error(); },
    close(): string { return `</${TagNames.FigureCaption}></${TagNames.Figure}>`; },
};

const BLOCK_INITIATORS: ReadonlyArray<BlockInitiator> = [
    UnorderedList,
    OrderedList,
    DefinitionList,
    Admonition,
    LinkTargetDefinition,
    Endnote,
    Figure,
    ImageBlock,
];

const MARKER_LINE_PATTERN = new RegExp(
    '^(' +
    BLOCK_INITIATORS.map(i => i.markerPattern.source).join('|') +
    ')' +
    /([ \t]+|$)(\S.*|$)/.source
);

const EXACT_MARKER_PATTERNS = BLOCK_INITIATORS
    .map(i => [
        i,
        new RegExp('^(?:' + i.markerPattern.source + ')$')
    ] as [BlockInitiator, RegExp]);

const blockInitiatorFromString = (marker: string) =>
    EXACT_MARKER_PATTERNS.find(([_, pattern]) => pattern.test(marker))![0];

/**
 * Replace nestable block elements.
 */
export function replaceBlocks(html: string, ctx: TransformHtmlWithContext): string {
    const lines = html.split('\n');
    const output: string[] = [];

    // `true` if the last two elements of `output` are `['some raw text', '\n']`.
    let lastOutputIsText = false;

    // Stack where the *first* element is top
    const levels: Level[] = [
        {
            originalIndentation: '',
            bodyIndentation: '',
            state: TopLevel,
        },
    ];
    let numPendingNewlines = 0;

    // Consider the following example:
    //
    // ```
    // term1
    // :   definition1
    // term2
    // :   definition2
    // ```
    //
    // When we are at `term2`, we can't tell if `term2` is a part of the
    // definition list that starts from `term1` or not. So, we store `term2`
    // to `definitionTermBuffer` until it's settled.
    let definitionTermBuffer: [string, string] | null = null;

    function removeTrailingNewline(): void {
        numPendingNewlines = 0;

        if (output[output.length - 1] === '\n') {
            output.pop(); // Remove trailing newline
        }
    }

    function closeCurrentList(): void {
        removeTrailingNewline();

        lastOutputIsText = false;
        output.push(levels[0].state.close());

        levels.shift();

        if (definitionTermBuffer != null) {
            // The last nonmarker line we saw turned out to be not contents of
            // `<dt>`.

            flushDefinitionTermBuffer();
        }
    }

    /**
     * This function is called when a line stored to `definitionTermBuffer`
     * turned out to be not a part of a definition list.
     */
    function flushDefinitionTermBuffer(): void {
        const notTerm = removePrefix(definitionTermBuffer![0],
            levels[0].bodyIndentation!) + definitionTermBuffer![1];

        lastOutputIsText = true;
        output.push(notTerm);
        output.push('\n');

        definitionTermBuffer = null;
    }

    for (let line of lines) {
        if (line.match(/^\s*$/)) {
            // A blank line lacks indentation information, so we defer
            // indentation change checking, whlist keeping the number of blank
            // lines.
            numPendingNewlines++;
            continue;
        }

        let [_2, indent, lineBody] = line.match(/^(\s*)(.*)$/)!;

        // Detect outdent
        let indentCommand: IndentCommand;
        while (
            (indentCommand = analyzeIndent(indent, levels[0].originalIndentation))
                == IndentCommand.Outdent
        ) {
            closeCurrentList();
        }

        // If we don't know the body indentation level yet, then guess one from
        // the first line of the body.
        if (levels[0].bodyIndentation == null) {
            levels[0].bodyIndentation = indent;
        }

        // Detect list marker
        const markerMatch = lineBody.match(MARKER_LINE_PATTERN);

        if (!markerMatch) {
            // No marker's here

            if (indentCommand != IndentCommand.Indent) {
                if (levels[0].state.captionStyle === CaptionStyle.PrecedingLine) {
                    if (definitionTermBuffer != null) {
                        // A definiton list item cannot contain more than one
                        // line. So, the current definition list ends here.
                        closeCurrentList();
                    } else {
                        // This might be contents of `<dt>`.
                        numPendingNewlines = 0;
                        definitionTermBuffer = [indent, lineBody];
                        continue;
                    }
                } else if (levels.length > 1) {
                    // We are no longer in the list.
                    closeCurrentList();
                }
            }

            // Copy blank lines (Actually, this is the only place where
            // `numPendingNewlines` matters)
            for (; numPendingNewlines; --numPendingNewlines) {
                output.push('\n');
            }

            // Preserve indentation
            lineBody = removePrefix(indent, levels[0].bodyIndentation!) + lineBody;

            lastOutputIsText = true;
            output.push(lineBody);
            output.push('\n');
            continue;
        }

        // Discard blank lines
        numPendingNewlines = 0;

        const [_, markerText, markerSpace, markerBody] = markerMatch;
        //const [markerType, markerAttr] = markerInfoFromString(markerText);

        // Is this marker is an addition to the current list?
        //
        // If `definitionTermBuffer != null`, then the input looks like:
        // ```
        // term1
        // :    definition1
        // term2
        //      :   definition2   <----
        // ```
        let isContinuation =
            (
                indentCommand == IndentCommand.Preserve ||
                definitionTermBuffer != null
            ) &&
            levels[0].state.canContinue(markerText);

        if (!isContinuation && indentCommand != IndentCommand.Indent && levels.length > 1) {
            // Close the current list first.
            closeCurrentList();
        }

        // Compute the indentation level of the item's body. Example:
        // ```
        //      - body
        // ^^^^^^^ this part
        // ```
        const markerBodyIndentation = indent + ' '
            .repeat(markerText.length + markerSpace.length);

        let caption: string | null = null;

        if (isContinuation) {
            levels[0].bodyIndentation = markerBodyIndentation;

            removeTrailingNewline();

            if (definitionTermBuffer != null) {
                // Create `<dt>` between `<dd>`s
                caption = removePrefix(definitionTermBuffer[0],
                    levels[0].originalIndentation) + definitionTermBuffer[1];
                definitionTermBuffer = null;
            }

            if (levels[0].state.captionStyle === CaptionStyle.SameLine) {
                caption = markerBody;
                levels[0].bodyIndentation = null;
            }

            output.push(levels[0].state.continue(markerText, caption, ctx));
        } else {
            // Start a new list.
            if (definitionTermBuffer) {
                throw new Error();
            }

            const initiator = blockInitiatorFromString(markerText);

            if (initiator.captionStyle === CaptionStyle.PrecedingLine) {
                // A definition list takes the last line as the contents of `<dt>`.
                if (lastOutputIsText) {
                    output.pop();
                    caption = output.pop()!;
                } else {
                    caption = '';
                }
            }

            let bodyIndentation: string | null = markerBodyIndentation;

            if (initiator.captionStyle === CaptionStyle.SameLine) {
                caption = markerBody;
                bodyIndentation = null;
            }

            const [state, fragment] = initiator.start(markerText, caption, ctx);

            output.push(fragment);

            levels.unshift({
                bodyIndentation,
                originalIndentation: indent,
                state,
            });
        }

        if (levels[0].state.captionStyle !== CaptionStyle.SameLine) {
            // The first line of the body is treated as a caption text.
            lastOutputIsText = true;
            output.push(markerBody);
            output.push('\n');
        }
    }

    while (levels.length > 1) {
        closeCurrentList();
    }
    removeTrailingNewline();

    return output.join('');
}
