// This source file defines constant strings for the Markfront XML format.
export const enum TagNames {
    Document = 'mf',
    Text = 'mf-text',
    Equation = 'mf-eq',
    DisplayEquation = 'mf-eq-display',
    Error = 'mf-error',
    Code = 'mf-code',
    CodeBlock = 'mf-codeblock',
    Title = 'mf-title',
    Lead = 'mf-lead',
    Diagram = 'mf-diagram',
    Admonition = 'mf-admonition',
    AdmonitionTitle = 'mf-admonition-title',
}

export const enum AttributeNames {
    CodeType = 'type',
}
