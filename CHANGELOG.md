# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
## [0.4.3] - 2020-02-26

- Changed the monospace font to [CMU Typewriter](https://en.wikipedia.org/wiki/Computer_Modern)
- Hide underlines when printing

## [0.4.2] - 2020-01-31

- Changed the monospace font to [Overpass Mono](https://overpassfont.org)
- Updated the version of the Rust compiler, slightly reducing the size of the WebAssembly module
- Updated `wasm-bindgen`

## [0.4.1] - 2020-01-29

- Internal enhancements for `Foremark-Gatsby`
- Fixed `\vec{...}` not rendering

## [0.4.0] - 2020-01-27

- Updated dependencies.
    - Many user-facing changes were made to KaTeX. Read the section v0.11.1 through v0.10.1 of [KaTeX's `CHANGELOG.md`](https://github.com/KaTeX/KaTeX/blob/master/CHANGELOG.md) to see the list of changes.
- Made various stylistic changes to the viewer application.
- **Breaking**: The viewer application no longer adds `.mf-processed` to `html`.

## [0.3.0] - 2019-05-08

- Fixed sidenotes not working inside admonition blocks.
- Fixed the uses of certain kinds of whitespaces (e.g., `\,`) breaking KaTeX equations.
- **Breaking**: Renamed `<mf>` to `<mf-document>` because custom elements must have a hyphen in their name.

## [0.2.3] - 2018-03-22

- Adjusted the typography.
- Some elements including equations are now processed inside a table.
- Fixed an issue with U+2028 (LINE SEPARATOR) character.
- Fixed a rendering issue with KaTeX.
- Indentations inside a quotation block are no longer ignored. This fixes the issue with indentation-based constructs (e.g., lists).

## [0.2.2] - 2018-01-21

- Improved the Japanese typography.
- The text width no longer changes depending on the sidebar's visibility. This mimics mdBook's behaviour.
- Adjusted the header style.

## [0.2.1] - 2018-01-17

- Fixed the behavior of the table of contents.
- Fixed the help dialog intercepting mouse events when hidden.

## [0.2.0] - 2018-01-17

- Fixed the width calculation of a text fragment inside a diagram that includes an XML-escaped character.
- **Breaking**: Disabled automatic heading numbering by default. Use the `headingNumbers` option to re-enable it.
- Updated the styling.
- Fixed the bug that diagrams were displayed too small.
- Added the "Expand all"/"Collapse all"/"Clear search" button.
- Added the help dialog.
- Improved the Japanese typography.

## [0.1.3] - 2018-01-16

- Enabled word-wrapping in code blocks.
- Line break markers are displayed in code blocks.
- Some symbols (e.g., `+` in `C++`) are now allowed in a fenced code block's language code.
- Double hyphens in HTML comments no longer crash the converter.

## [0.1.2] - 2018-01-15

- Fixed the bug that an unresolved reference causes a runtime error and prevents further processing.
- Fixed the bug that a citation reference (`[#citeId]`) prevented a heading from being formed.
- Fixed the bug that a citation is rendered inside the sidenote margin for multiple times in a single subsection.
- Fixed the bug that tables consumed adjacent lists.
- Fixed the bug that lists consumed adjacent headings.
- The following style of a diagram is now supported:

```
    :::::::::::::::::::::::::::::
    :: ,-----,                ​ ::
    :: |     | "le si'o kurfa"​ ::
    :: '-----'                ​ ::
    :::::::::::::::::::::::::::::
```

## [0.1.1] - 2018-01-14

- `<pre>` is now permitted as the document root and treated as `<mf-text>`. This makes text browsers a viable option for displaying Foremark documents.
- `data-rel="foremark"` is no longer necessary except in unusual use cases.

## [0.1.0] - 2018-01-13

- The following hyperlink syntaxes are now supported: `https://bare.url.example.com` `bare-address@example.com` `<protocol://example.com>` `<weird address@example.com>`
- Citations (`[#citeId]`) are now supported.
- Fixed the issue that a table is not rendered properly when there's no preceding/following text.
- Fixed some instances of the issue that block-level markups are parsed inside a link target definition.
- Specifying a `title` on a media tag using the syntax `![](url "title here")` is now supported.

## [0.0.15] - 2018-01-09

- Fixed Safari-specific layouting issues with a text inside a digram.
- Version information is outputted to the browser's console.
- Diagrams' color scheme now respects [`@media (prefers-color-scheme: dark)`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme).
- Updated oEmbed endpoint URLs to use HTTPS to avoid the mixed content issue when a page is served over HTTPS.
- Added a property `OEmbedOptions.timeout`.

## [0.0.14] - 2018-01-08

- Fixed Firefox-specific layouting issues with a text inside a digram.

## [0.0.13] - 2018-01-08

- Fixed definition lists generating a text `null` when a caption is missing between two definitions.
- A table of contents is displayed by default if there's a sitemap attached to a current page.

## [0.0.12] - 2018-01-08

- Fixed sidenotes referenced inside headings messing up the layout and the table of contents.
- Fixed equations not being recognized when there's no preceding text.

## [0.0.11] - 2018-01-06

- Added the WOFF2 version of every included web font. This reduces the downloaded asset size by up to 160KB.
- Changed the way viewer configuration objects are supplied. Configuration objects now can be provided from asynchronously loaded script tags, paving the way to collectively customize the behavior of a set of documents.
- Fixed the issue that the selection of the table of contents does not follow the scroll position.
- A sitemap can be defined in configuration. The sitemap is displayed in the table of contents together with a current page's headings.

## [0.0.10] - 2018-01-05

- Outdentation in a list caused by hard wrapping no longer closes a list.
- Wrap `<mf-code>` with `<pre>` so that it's formatted as intended on Safari's Reader View.
- Digrams are now rendered using a monospace font.
- Fixed the issue that a figure label appears in a line isolated from the rest of the figure caption.
- Fixed the issue that `<mf-ref>` generates an unnecessary whitespace (e.g., `Figure 1" "`).

## [0.0.9] - 2018-12-31

- Made some borders thinner when printing.
- Made a subtle improvement in the user experience.
- Make font sizes slightly larger.

## [0.0.8] - 2018-12-31

- Apply `-webkit-overflow-scrolling` on tables for inertia scrolling on iOS
- Reset the visibility flag of the sidebar modal when it's hidden.

## [0.0.7] - 2018-12-31

- Remove test code from the NPM package

## [0.0.6] - 2018-12-31

- The user interface was restyled to make it less intrusive to the contents.
- The search field is now functional.
- `expandMfText` now can be used in a Node.js environment.
- Whitespace characters are now permitted between brackets in a symbolic hyperlink like `[text] [symname]`.
- Hyperlink titles can be specified using the syntax: `[text](url "title")`.
- Removed `https://derpicdn.net/img/*` from Derpibooru's oEmbed URL scheme.
- Text contents of `<mf-figure-caption>` are now wrapped with `<p>`.
- Fixed a parsing issue that a closing parenthesis (`)`) of a media tag was sometimes overlooked.
- The table of contents pane now supports keyboard navigation.

## [0.0.5] - 2018-12-30

- Improved accessibility. Many elements now have ARIA roles and attributes.
- Code blocks inside figures are no longer aligned to center.
- A symbolic hyperlink now can include inline code fragments and other tags.
- Add media handlers, a facility for embedding a variety of media types into a document.
    - The following providers are supported by the oEmbed handler: Clyp, Codepen, Derpibooru, DeviantArt, Facebook, MixCloud, SlideShare, Twitter, SoundCloud, and Vimeo.
    - The inline frame media handler uses `RegExp`-based URL transformation rules to embed YouTube and Sketchfab contents.
    - Direct links are handled by one of the HTML5 media handlers depending on the file extension.
- CSS is now embedded into JS files. This may lead to a significant reduction in the page load time in a high-latency environment.
- Sectioning roots are now skipped while generating a table of contents. As such, headings inside block quotations are no longer displayed in the table of contents.

## [0.0.4] - 2018-12-26

- Added a stylesheet for printing.
- Flickering on page load was somewhat alleviated by hiding the page until the stylesheet is loaded.

## [0.0.3] - 2018-12-25

- Modifiied `prepublishOnly` to clean the output directory before building.
- Removed `*.map` from the NPM package.

## [0.0.2] - 2018-12-25

- Added a fallback style to the document footer.
- Added `prepublishOnly` NPM script so that the program is automatically built before running `npm publish`.

## 0.0.1 - 2018-12-25

- Initial release.

[Unreleased]: https://github.com/Foremark/Foremark/compare/0.4.3...HEAD
[0.4.3]: https://github.com/Foremark/Foremark/compare/0.4.2...0.4.3
[0.4.2]: https://github.com/Foremark/Foremark/compare/0.4.1...0.4.2
[0.4.1]: https://github.com/Foremark/Foremark/compare/0.4.0...0.4.1
[0.4.0]: https://github.com/Foremark/Foremark/compare/0.3.0...0.4.0
[0.3.0]: https://github.com/Foremark/Foremark/compare/0.2.3...0.3.0
[0.2.3]: https://github.com/Foremark/Foremark/compare/0.2.2...0.2.3
[0.2.2]: https://github.com/Foremark/Foremark/compare/0.2.1...0.2.2
[0.2.1]: https://github.com/Foremark/Foremark/compare/0.2.0...0.2.1
[0.2.0]: https://github.com/Foremark/Foremark/compare/0.1.3...0.2.0
[0.1.3]: https://github.com/Foremark/Foremark/compare/0.1.2...0.1.3
[0.1.2]: https://github.com/Foremark/Foremark/compare/0.1.1...0.1.2
[0.1.1]: https://github.com/Foremark/Foremark/compare/0.1.0...0.1.1
[0.1.0]: https://github.com/Foremark/Foremark/compare/0.0.15...0.1.0
[0.0.15]: https://github.com/Foremark/Foremark/compare/0.0.14...0.0.15
[0.0.14]: https://github.com/Foremark/Foremark/compare/0.0.13...0.0.14
[0.0.13]: https://github.com/Foremark/Foremark/compare/0.0.12...0.0.13
[0.0.12]: https://github.com/Foremark/Foremark/compare/0.0.11...0.0.12
[0.0.11]: https://github.com/Foremark/Foremark/compare/0.0.10...0.0.11
[0.0.10]: https://github.com/Foremark/Foremark/compare/0.0.9...0.0.10
[0.0.9]: https://github.com/Foremark/Foremark/compare/0.0.8...0.0.9
[0.0.8]: https://github.com/Foremark/Foremark/compare/0.0.7...0.0.8
[0.0.7]: https://github.com/Foremark/Foremark/compare/0.0.6...0.0.7
[0.0.6]: https://github.com/Foremark/Foremark/compare/0.0.5...0.0.6
[0.0.5]: https://github.com/Foremark/Foremark/compare/0.0.4...0.0.5
[0.0.4]: https://github.com/Foremark/Foremark/compare/0.0.3...0.0.4
[0.0.3]: https://github.com/Foremark/Foremark/compare/0.0.2...0.0.3
[0.0.2]: https://github.com/Foremark/Foremark/compare/0.0.1...0.0.2
