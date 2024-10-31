## v1.4.3

*2024-11-01*

**Fixed**

- Completion for Wikitext now includes `<onlyinclude>`, `<includeonly>` and `<noinclude>`

**Changed**

- Color provider for argument default values in Wikitext

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
