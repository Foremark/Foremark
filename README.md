# Foremark

Foremark is a tool for writing stylized plain text documents that can be managed and shared easily. Foremark extends upon the concept of [Markdeep](http://casual-effects.com/markdeep/).

![](http://ipfs.io/ipfs/QmTuLVV4pbE4Dfy1MEofSDNLeTkfR2XSUifJQSXx4FtLGr)

```XML
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en"><pre><![CDATA[

                            **Title**

Welcome to Foremark, a technology for writing a shareable, _stylized_
text document.

            :::::::::::::::::::::::::::::::::::::::::::::
            ::            .----------.                 ::
            ::  Write --> | Document | --> Web Browser ::
            ::            '----------'                 ::
            :::::::::::::::::::::::::::::::::::::::::::::

]]></pre> <!-- Foremark footer -->
<script src="https://unpkg.com/foremark/browser/foremark.js" async="async"/></html>
```

Save the above text as [`hello.fm.xhtml`](https://foremark.github.io/hello.fm.xhtml) and open it with a web browser.

## Features

- Rich syntax based on **Markdown**.
- **LaTeX Equations**, rendered via [KaTeX](https://katex.org).
- **ASCII diagrams**, converted to SVG via [Svgbob](https://github.com/ivanceras/svgbob).
- **Sidenotes** and other stylings inspired by Edward Tufte's handouts.
- **Syntax highlighting** via [highlight.js](https://highlightjs.org).
- **Responsive** — Documents can be displayed on a desktop screen, tablet and smartphone and printed on paper.
- **Media handlers** allow embedding various media contents including images, video files, audio files, and oEmbed URLs.
- **Lazy loading** — Foremark's code is broken into multiple modules and they are loaded as needed. This is implemented using Webpack's [code splitting feature](https://webpack.js.org/guides/code-splitting/).
- **Self-contained (offline) bundle** — `foremark.bundle.js` is the special build of Foremark Viewer that includes every required asset in a single `.js` file and does not require an internet connection.

### Differences from Markdeep

- Improved internal design — The rendering process is broken into multiple meaningful passes.
- Better browsing experience.
- Built based on modern web technologies. The source code is written in TypeScript and organized into modules.
- Supports flexible input formats ranging from Markdeep-like annotated plain text to explicit markups to meet various needs. In other words, you can write as explicitly as you want to!
- Svgbob calculates character widths correctly based on [East Asian Width]. This means wide characters such as `漢字` and `🚀` can be used inside an ASCII diagram with no problem.
- Foremark documents use the `.xhtml` file extension.
    - Most source browsing softwares display XHTML files in the raw code. This is more preferrable to the situation with HTML, which is likely to be unintentionally "parsed" and mangled by less-functional viewers such as GitHub and GitLab.
    - XHTML defaults to UTF-8 when the encoding is not specified. Thus `<meta charset="utf-8">` is not needed in XHTML.
    - On a text browser (e.g., Lynx), Foremark gracefully falls back to plain-text rendering.
- The true offline experience — the self-contained bundle *really* includes every dependent library like KaTeX.

[East Asian Width]: http://www.unicode.org/reports/tr11/

## Development

### How does it work?

#### Step 1 - Load input (`browser-stage0.ts`, `browser-stage1.tsx`)

An input document tree is loaded from the currently open document. The script tag is inspected to determine the base path for lazy-loaded assets.

#### Step 2 - Expand `<mf-text>` (`mftext.ts`)

Annotations in the text contents of `mf-text` elements are parsed and converted into explicit markups. Non-textual parts are simply passed through, so you can write any part of a text using markups if you want to for some reasons.

The output of this step is a mixture of XHTML and custom elements, which we call Foremark XML. At this point, most constructs are represented using semantic markups, thus the document is ready to be styled using CSS. On the other hand, a few complex constructs are preserved in their original plain text form. Thus, the raw code of the format is still human-read/writable. The next step will further process complex constructs for optimal browser viewing.

#### Step 3 - Complex styling (`mfview.ts`)

This step processes custom elements of Foremark XML. The result looks pretty when viewed via a web browser, but the raw code might not no longer retain human-readability.

This step involves:

- LaTeX equation processing
- Diagrams to SVG conversion
- Footnote/sidenote layouting

#### Step 4 - User interface (`view.tsx`)

The final HTML is displayed by a web-based viewer application embedded in `foremark.js`, which provides stylesheets as well as rich functionalities such as a table of contents.

### Directory structure

- `app/` — The source code of this program.
    - `converter/` — Foremark processor.
    - `index.ts` — The entry point of the library.
    - `view/` — The viewer application.
    - `browser.tsx` — The entry point for a web browser.
    - `foremark.ts` — Common definitions of the Foremark format.
    - `utils/` — Utilities.
- `lib/` — Helper code for using external libraries.
- `rust/` — Rust crates.
    - `diagram/` — An interface to Svgbob from the main application.
    - `svgbob/` — Git subtree of <https://github.com/ivanceras/svgbob.git>.
- `examples/` — Example Foremark files.
    - `*.mf.xhtml`
- `test/` — [Mocha](https://mochajs.org/) tests. They require `dist/` to run.

**Intermediate build artifacts:**

- `wasm/` — WebAssembly modules generated by [`wasm-bindgen`](https://github.com/rustwasm/wasm-bindgen).

**NPM package:**

- `browser/` — Foremark processor + viewer to be loaded by Foremark files.
    - `foremark.js` — The main file of the viewer.
    - `foremark-*.js`, `assets/` — Asset files that are loaded on demand.
    - `foremark.bundle.js` — Includes all of the above files in a single large package. (Self-contained bundle)
    - `*.wasm`
    - `licenses.txt` — License information of all software packages included in this directory.
- `dist/` — Provides a Foremark processor library.
    - `index.js` — The entry point of the library.

### Building

Prerequisite:

- [Node.js](https://nodejs.org) ≥ 10
- `npm install -g yarn`
- [`rustup`](https://rustup.rs) `toolchain add nightly-2019-01-20`
- `rustup target add wasm32-unknown-unknown --toolchain nightly-2019-01-20`
- `cargo install` [`wasm-bindgen-cli`](https://rustwasm.github.io/wasm-bindgen/whirlwind-tour/basic-usage.html) `--version 0.2.33`
- `cargo install` [`wasm-snip`](https://github.com/rustwasm/wasm-snip)
- [Binaryen](https://github.com/WebAssembly/binaryen) (`brew install binaryen` on Homebrew) including: `wasm-opt`
- `cargo install` [`cargo-license`](https://github.com/onur/cargo-license)

```shell
$ yarn install

$ yarn build

# Alternatively, start the Webpack development server:
$ yarn build:wasm
$ yarn start --open
```

## Meta

- Foremark was originally named Markfront and changed later because the name was taken in many source code hosting services. "Front" was chosen as another adjective indicating a direction. It also refers to the front end of the layered transformation architecture.
