# Markfront

Markfront is a technology for writing semi-plain text documents that extends upon the concept of [Markdeep](http://casual-effects.com/markdeep/).

## Features

- Lazy loading — Markfront's code is broken into multiple modules and they are loaded as needed. This is implemented using Webpack's [code splitting feature](https://webpack.js.org/guides/code-splitting/).
- The optional self-contained bundle (`markfront.bundle.js`) includes every required asset in a single `.js` file and does not require an internet connection.
- TODO

## Differences from Markdeep

- Improved internal design — The rendering process is broken into multiple meaningful passes.
- Better browsing experience.
- Built based on modern web technologies. The source code is written in TypeScript and organized into modules.
- Supports flexible input formats ranging from Markdeep-like annotated plain text to explicit markups to meet various needs. In other words, you can write as explicitly as you want to!
- Less unreliable tricks mean less corner cases.
- The recommended file format uses the `.xhtml` extension. Most source tree browsing softwares display XHTML files in the raw code. This is more preferrable to the situation with Markdeep's HTML, which is likely to be inadequately "parsed" and mangled by less-functional viewers such as GitHub and GitLab.

## How does it work?

### Step 1 - Expand `<mf-text>` (`mftext.ts`)

Annotations in the text contents of `mf-text` elements are parsed and converted into explicit markups. Non-textual parts are simply passed through, so you can write any part of a text using markups if you want to for some reasons.

The output of this step is a mixture of XHTML and custom elements, which we call Markfront XML. At this point, most constructs are represented using semantic markups, thus the document is ready to be styled using CSS. On the other hand, a few complex constructs are preserved in their original plain text form. Thus, the raw code of the format is still human-read/writable. The next step will further process complex constructs for optimal browser viewing.

### Markfront XML

The following custom elements are defined:

- `<mf-error>` — indicates an error encountered while processing `<mf-text>`.
- `<mf-codeblock>` — Wraps one or more `<mf-code>` code blocks (optional).
- `<mf-code>` — A code block with syntax highlighting. Not to be confused with `<code>`.
- `<mf-eq>` - A LaTeX inline equation.
- `<mf-eq-display>` - A LaTeX display equation.
- `<mf-title>`
- `<mf-lead>`
- `<ul>`
    - `<li class="plus">`
    - `<li class="minus">`
    - `<li class="asterisk">`
    - `<li class="checked">`
    - `<li class="unchecked">`

### Step 2 - Complex styling (`mfview.ts`)

This step processes custom elements of Markfront XML. The result looks pretty when viewed via a web browser, but the raw code might not no longer retain human-readability.

This step may involve:

- LaTeX equation processing
- Markdeep diagrams to SVG conversion
- Footnote/sidenote layouting

### Step 3 - Add user interface (`view.tsx`)

The final HTML is displayed by a web-based viewer application embedded in `markfront.js`, which provides rich functionalities such as table of contents.

## Directory structure

- `app/` — The source code of this program.
    - `converter/` — Markfront processor.
    - `index.ts` — The entry point of the library.
    - `view/` — The viewer application.
    - `browser.tsx` — The entry point for a web browser.
    - `markfront.ts` — Common definitions of the Markfront format.
    - `utils/` — Utilities.
- `lib/` — Helper code for using external libraries.
- `examples/` — Example Markfront files.
    - `browser` → `../browser` (symlink)
    - `*.mf.xhtml`

**NPM package:**

- `browser/` — Markfront processor + viewer to be loaded by Markfront files.
    - `markfront.js` — The main file of the viewer.
    - `markfront-*.js`, `*.css`, `assets/` — Asset files that are loaded on demand.
    - `markfront.bundle.js` — Includes all of the above files in a single large package. (Self-contained bundle)
- `dist/` — Provides a Markfront processor library.
    - `index.js` — The entry point of the library.

## Meta

- "Front" was chosen as another adjective indicating a direction. It also refers to the front end of the layered transformation architecture.
