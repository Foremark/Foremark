# Markfront

Markfront is a technology for writing semi-plain text documents that extends upon the concept of [Markdeep](http://casual-effects.com/markdeep/).

## Differences from Markdeep

- Improved internal design — The rendering process is broken into multiple meaningful passes.
- Better browsing experience.
- Built based on modern web technologies. The source code is written in TypeScript and organized into modules.
- Supports flexible input formats ranging from Markdeep-like annotated plain text to explicit markups to meet various needs. In other words, you can write as explicitly as you want to!
- Less unreliable tricks mean less corner cases.
- The recommended file format uses the `.xml` extension. Most softwares display XML files in the raw code. This is more preferrable to the situation with Markdeep's HTML, which is likely to be inadequately "parsed" and mangled by less-functional viewers such as GitHub's source code view.

## How does it work?

### Step 1 - Expand `<mf-text>`

Annotations in the text contents of `mf-text` elements are parsed and converted into explicit markups. Non-textual parts are simply passed through, so you can write any part of a text using markups if you want to for some reasons.

The output of this step is a mixture of XHTML and custom elements, which we call Markfront XML. At this point, most constructs are represented using semantic markups, thus the document is ready to be styled using CSS. On the other hand, a few complex constructs are preserved in their original plain text form. Thus, the raw code of the format is still human-read/writable. The next step will further process complex constructs for optimal browser viewing.

### Markfront XML

The following custom elements are defined:

- `<mf-error>` — indicates an error encountered while processing `<mf-text>`.
- `<mf-codeblock>` — Wraps one or more `<mf-code>` code blocks (optional).
- `<mf-code>` — A code block with syntax highlighting. Not to be confused with `<code>`.
- `<mf-eq>` - A LaTeX inline equation.
- `<mf-eq-display>` - A LaTeX display equation.

### Step 2 - Complex styling

This step processes custom elements of Markfront XML. The result looks pretty when viewed via a web browser, but the raw code might not no longer retain human-readability.

This step may involve:

- LaTeX equation processing
- Markdeep diagrams to SVG conversion
- Footnote/sidenote layouting

### Step 3 - Add user interface

The final HTML is displayed by a web-based viewer application embedded in `markfront.js`, which provides rich functionalities such as table of contents.

## Meta

- "Front" was chosen as another adjective indicating a direction. It also refers to the front end of the layered transformation architecture.
