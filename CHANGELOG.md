## v1.10.0

*2025-06-16*

**Added**

- Localization for the Monaco Editor's core
- Keybindings for Wikitext formatting
- Option to specify a predefined WikiLint configuration

**Fixed**

- Disable the default link provider for Wikitext
- Italic/bold apostrophes end the external link in Wikitext

## v1.9.3

*2025-06-07*

**Fixed**

- Highlighting of triple brackets in Wikitext
- Highlighting of complex parameter names in Wikitext
- Highlighting of headings followed by comments in Wikitext

## v1.9.2

*2025-05-26*

**Added**

- Localization for WikiLint

## v1.9.1

*2025-05-23*

**Added**

- Quick fix for ESLint suggestions

## v1.9.0

*2025-05-20*

**Added**

- Quick fix for diagnostics from WikiLint, ESLint, and Stylelint

## v1.8.2

*2025-03-15*

**Fixed**

- Only function hooks are allowed to take parameters

## v1.8.1

*2025-03-11*

**Added**

- Completion suggestions for magic words in Wikitext now contain documentation

## v1.8.0

*2025-03-08*

**Added**

- [Stylelint](https://stylelint.io/) integration for Wikitext

**Fixed**

- Changes in WikiLint/ESLint/Stylelint configurations now take effects immediately (after any editing) on a MediaWiki site

## v1.7.2

*2025-03-02*

**Fixed**

- Highlighting of multiple `<th>` with attributes delimited by `!!` in Wikitext

## v1.7.0

*2025-02-16*

**Added**

- Auto-linking for URLs in Wikitext
- Hover information and signature help for magic words in Wikitext
- Inlay hints for template anonymous parameters in Wikitext

**Changed**

- Language services for Wikitext are now provided directly by [WikiParser-Node](https://github.com/bhsd-harry/wikiparser-node), which is consistent with the [VSCode extension](https://github.com/bhsd-harry/vscode-extension-wikiparser)

## v1.6.0

*2025-01-30*

**Added**

- JSON wrapped in some extension tags is now syntax highlighted
- Highlight the namespace of a redirect link in Wikitext
- Parse `{{{!}}` and `{{!}}}` as the start and end of a table in Wikitext

**Fixed**

- Parser functions and variables without a leading `#` are now correctly highlighted
- Template parameter names can be empty
- Fatal error when [wikiparse](https://github.com/bhsd-harry/wikiparser-node/wiki/wikiparse) is not loaded
- Many image parameters (e.g., `thumb`, `link=`, and `1px`) are now correctly highlighted
- URL protocols are case-insensitive
- No illegal language code in the language conversion syntax
- Allow HTML entities in `<nowiki>`
- URL in double square brackets
- Warn URI encoding in template names and URI-encoded illegal characters in link targets

**Changed**

- Parser functions and variables are now highlighted with the same style
- `caption`, `th` and `td` are now highlighted with the same style

## v1.5.0

*2024-12-02*

**Added**

- Reference provider for Wikitext now also includes HTML tags and wiki links
- Rename provider for Wikitext, including parser functions, templates and arguments
- Completion for tag attribute keys in Wikitext
- Folding range provider for Wikitext

**Fixed**

- Completion for Wikitext now includes `<onlyinclude>`, `<includeonly>` and `<noinclude>`

**Changed**

- Color provider for argument default values in Wikitext
- Completion for behavior switches in Wikitext
- The Lua linter is now based on [Luacheck](https://github.com/mpeterv/luacheck) instead of luaparse

## v1.4.2

*2024-10-28*

**Changed**

- Color provider for parameter values in Wikitext
- Dynamic definition of Wikitext grammar

## v1.4.0

*2024-10-25*

**Added**

- Color provider for attribute values in Wikitext

## v1.3.1

*2024-08-17*

**Added**

- Reference provider for Wikitext, including extension tags, parser functions, templates, and arguments

## v1.3.0

*2024-08-02*

**Added**

- Completion for Wikitext

## v1.2.5

*2024-07-13*

**Added**

- `ITextModel.lint` method to enable/disable linting

## v1.2.2

*2024-05-09*

**Added**

- JavaScript, CSS and HTML code blocks wrapped in `<pre>` tags are now syntax highlighted

## v1.2.1

*2024-05-08*

**Added**

- Additional auto-close tag pairs

**Fixed**

- Always specify compatible versions of [monaco-editor](https://www.npmjs.com/package/monaco-editor) and [@bhsd/monaco-editor-es](https://www.npmjs.com/package/@bhsd/monaco-editor-es)
- Improve TextMate syntax for Wikitext

## v1.1.0

*2024-05-01*

**Added**

- An alternative entry point for auto-loading the Monaco Editor's core and workers

**Removed**

- `MonacoWikiEditor` class

## v1.0.0

*2024-04-28*

**Fixed**

- Default workers for CSS, JavaScript, and JSON

**Changed**

- Load [Monaco Editor](https://microsoft.github.io/monaco-editor/) as an AMD module

## v0.3.1

*2024-04-26*

**Fixed**

- Compatibility with AMD modules

## v0.3.0

*2024-04-25*

**Added**

- Load WikiLint, ESLint and Stylelint configuration from [CodeMirror-MediaWiki](https://www.npmjs.com/package/@bhsd/codemirror-mediawiki) settings
- Support for `jquery.textSelection`
- Support for `JSON.parse`

**Fixed**

- Font color for the `<code>` tag when hovering

## v0.2.2

*2024-04-19*

**Added**

- Glyphs for the linter
- Support for [ESLint](https://eslint.org/), [Stylelint](https://stylelint.io/), and [luaparse](https://npmjs.com/package/luaparse)

**Fixed**

- Perform linting on initialization

## v0.2.1

*2024-04-19*

**Added**

- First integration with [MediaWiki environment](https://doc.wikimedia.org/mediawiki-core/master/js/)
- New TextMate languages: JSON

## v0.1.1

*2024-04-18*

**Fixed**

- [WikiLint](https://github.com/bhsd-harry/wikiparser-node) configuration

## v0.1.0

*2024-04-18*

**Added**

- [WikiLint](https://github.com/bhsd-harry/wikiparser-node) integration

## v0.0.2

*2024-04-04*

**Fixed**

- Missing TextMate languages: HTML, CSS, and JavaScript

## v0.0.1

*2024-04-03*

**Added**

- New theme: Nord

## v0.0.0

*2024-04-01*

First published version
