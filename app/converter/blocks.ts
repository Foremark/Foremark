import {removePrefix, analyzeIndent, IndentCommand} from '../utils/string';

interface Level {
    /**
     * The indentation of the previous level (which is equal to that of the
     * line that started this level).
     */
    originalIndentation: string;

    /**
     * The indentation of the contents.
     */
    bodyIndentation: string;

    state: BlockState;
}

interface BlockMarkerTraits {
    /**
     * Specific to `DefinitionList`. If this indicates `true`, a marker takes
     * the preceding line as the caption text.
     */
    readonly needsCaption?: boolean;
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
    start(marker: string, caption: string | null): [BlockState, string];
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
    continue(marker: string, caption: string | null): string;

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
        return /^(?:-|\+|\*|(?:-\s+)\[[x ]\])$/.test(marker);
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
            `<ol start="${i}"><li>`,
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
    needsCaption: true,

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

const BLOCK_INITIATORS: ReadonlyArray<BlockInitiator> = [
    UnorderedList,
    OrderedList,
    DefinitionList,
];

const MARKER_LINE_PATTERN = new RegExp(
    '^(' +
    BLOCK_INITIATORS.map(i => i.markerPattern.source).join('|') +
    ')' +
    /([ \t]+)(\S.*)/.source
);

const EXACT_MARKER_PATTERNS = BLOCK_INITIATORS
    .map(i => [
        i,
        new RegExp('^' + i.markerPattern.source + '$')
    ] as [BlockInitiator, RegExp]);

const blockInitiatorFromString = (marker: string) =>
    EXACT_MARKER_PATTERNS.find(([_, pattern]) => pattern.test(marker))![0];

/**
 * Replace nestable block elements.
 */
export function replaceBlocks(html: string): string {
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
            levels[0].bodyIndentation) + definitionTermBuffer![1];

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

        // Detect list marker
        const markerMatch = lineBody.match(MARKER_LINE_PATTERN);

        if (!markerMatch) {
            // No marker's here

            if (indentCommand != IndentCommand.Indent) {
                if (levels[0].state.needsCaption) {
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
            lineBody = removePrefix(indent, levels[0].bodyIndentation) + lineBody;

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

            output.push(levels[0].state.continue(markerText, caption));

            lastOutputIsText = true;
            output.push(markerBody);
            output.push('\n');
        } else {
            // Start a new list.
            if (definitionTermBuffer) {
                throw new Error();
            }

            const initiator = blockInitiatorFromString(markerText);

            if (initiator.needsCaption) {
                // A definition list takes the last line as the contents of `<dt>`.
                if (lastOutputIsText) {
                    output.pop();
                    caption = output.pop()!;
                } else {
                    caption = '';
                }
            }

            const [state, fragment] = initiator.start(markerText, caption);

            lastOutputIsText = true;
            output.push(fragment);
            output.push(markerBody);
            output.push('\n');

            levels.unshift({
                bodyIndentation: markerBodyIndentation,
                originalIndentation: indent,
                state,
            });
        }
    }

    while (levels.length > 1) {
        closeCurrentList();
    }
    removeTrailingNewline();

    return output.join('');
}