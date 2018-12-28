
export const enum TextInternalTagNames {
    /**
     * Defines a target of a hyperlink.
     *
     * ```
     * [`DuckDuckGo`][]
     *
     * [`DuckDuckGo`]: https://duckduckgo.com
     * <!-- <mf-link-target link-id="&lt;code&gt;DuckDuckGo&lt;/code&gt;" /> -->
     * ```
     *
     * This tag is generated when `[xxx]: ...` is discovered by `blocks.ts`.
     * Later, the text content of `<mf-link-target>` is used as `href` of `<a>`.
     * Unlike figures and endnotes, references are resolved during Foremark
     * text processing.
     */
    LinkTarget = 'mf-link-target',
}

export const ENDNOTE_ID_RE = /[^[\]<> :\t]+/;
export const FIGURE_ID_RE = /[^[\]<>\t]+[ :][^[\]<> :\t]+/;

export const FLOATING_SIZE_RE = /(?:\^|!!?)/;

export function parseFloatingSize(s: string): null | 'large' | 'full' {
    switch (s) {
        case '^': return null;
        case '!': return 'large';
        case '!!': return 'full';
        default: throw new Error();
    }
}

/** The URL and attributes part of the media tag. */
export const MEDIA_PARAM_RE = /("[^"<>]*"|[^"\s<>]+)(\s+[^\)]*?)?/;
//                              ^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^
//                               URL (maybe quoted)  unvalidated attribs
//                                                    e.g., ` class="a"`
