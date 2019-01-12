// This source file defines constant strings for the Foremark XML format.
export const enum TagNames {
    Document = 'mf',
    Text = 'mf-text',
    Equation = 'mf-eq',
    DisplayEquation = 'mf-eq-display',
    Error = 'mf-error',
    Block = 'mf-block',
    Code = 'mf-code',
    CodeBlock = 'mf-codeblock',
    Title = 'mf-title',
    Lead = 'mf-lead',
    Diagram = 'mf-diagram',
    Admonition = 'mf-admonition',
    AdmonitionTitle = 'mf-admonition-title',
    Note = 'mf-note',
    Figure = 'mf-figure',
    FigureCaption = 'mf-figure-caption',
    Ref = 'mf-ref',
    Media = 'mf-media',
    Cite = 'mf-cite',
}

export const enum AttributeNames {
    CodeType = 'type',
}

/**
 * A `TagNames.Figure` element having an identifier conforming to this pattern
 * can have some attributes implied from the identifier.
 *
 * This pattern includes three matches: figure type, a symbol specifying
 * a separator between the figure type and number, and base name (identifies
 * a figure of a particular type).
 */
export const FIGURE_STANDARD_ID_RE = /^(.+)([ :])([^ :]+)$/;
