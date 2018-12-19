
export const enum InternalTagNames {
    /**
     * Defines a target of a hyperlink.
     *
     * ```
     * [DuckDuckGo &][]
     *
     * [DuckDuckGo &]: https://duckduckgo.com
     * <!-- <mf-link-target link-id="DuckDuckGo &amp;amp;" /> -->
     * ```
     *
     * This tag is generated when `[xxx]: ...` is discovered by `blocks.ts`.
     * Later, the text content of `<mf-link-target>` is used as `href` of `<a>`.
     */
    LinkTarget = 'mf-link-target',
}
