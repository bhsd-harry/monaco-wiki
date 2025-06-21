[![npm version](https://badge.fury.io/js/monaco-wiki.svg)](https://www.npmjs.com/package/monaco-wiki)
[![CodeQL](https://github.com/bhsd-harry/monaco-wiki/actions/workflows/codeql.yml/badge.svg)](https://github.com/bhsd-harry/monaco-wiki/actions/workflows/github-code-scanning/codeql)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/18f690b061a64d40ad0d8bec1f5489e3)](https://app.codacy.com/gh/bhsd-harry/monaco-wiki/dashboard)

# Description

**Monaco-Wiki** registers the [Wikitext](https://www.mediawiki.org/wiki/Wikitext) language in the [Monaco Editor](https://microsoft.github.io/monaco-editor/). It is a web version of the [Visual Studio Code](https://code.visualstudio.com/) extensions developed by [Rowe Wilson Frederisk Holme](https://github.com/Frederisk/Wikitext-VSCode-Extension) and [Bhsd](https://github.com/bhsd-harry/vscode-extension-wikiparser). The TextMate grammar is substantially revised to be site-specific and more accurate.

# Usage

You may load the Monaco Editor on your own:

```js
import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor/+esm';
import registerWiki from 'https://cdn.jsdelivr.net/npm/monaco-wiki';

await registerWiki(
	monaco,

	// Set to `true` if used in a MediaWiki site,
	// or a string to specify a preset configuration (https://github.com/bhsd-harry/wikiparser-node/tree/main/config)
	false,

	// (optional) i18n language codes with a preferred order,
	// e.g. `['zh-hans', 'zh-hant', 'en']
	['en'],

	// (optional) custom download URL for the `wikiparse` object`
	'https://cdn.jsdelivr.net/npm/wikiparser-node'
);
```

or simply:

```js
// Automatically loads the Monaco Editor's core and relevant workers
import 'https://cdn.jsdelivr.net/npm/monaco-wiki/dist/all.min.js';

await monaco; // The global `monaco` is a promise that resolves to the Monaco editor
```

# Language Aliases

- wikitext
- wiki
- mediawiki

# Themes

|Name|ID|
|:-:|:-:|
|Monokai|`monokai`|
|Nord|`nord`|

If you wish to use other themes listed [here](https://shiki.style/themes), please [submit a feature request](https://github.com/bhsd-harry/monaco-wiki/issues/new).

# Known Issues

## Syntax Highlighting

### Extension

1. [Extension:Translate](https://www.mediawiki.org/wiki/Extension:Translate) is not supported.

### Transclusion

1. [Bracket pair colorization](https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IEditorOptions.html#bracketPairColorization) is problematic ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#T53961%3A%20Output%20correct%20nowikis%20in%20template%20arguments)), especially for 4 consecutive braces ([left](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%20with%20templated%20name) or [right braces](http://bhsd-harry.github.io/monaco-wiki/tests.html#Template%20with%20just%20whitespace%20in%20it%2C%20T70421)).
1. Substitution is not correctly highlighted ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Scribunto%3A%20isSubsting%20during%20PST)).
1. Non-existing parser functions starting with `#` are highlighted as parser functions ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Parsoid%3A%20unknown%20parser%20function%20(T314524))).
1. Multiline template names should be invalid ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Don't%20recognize%20targets%20split%20by%20newlines)).
1. Template names containing comments are not highlighted ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Handle%20comments%20in%20the%20target)).
1. Template parameter names containing newlines or comments are not highlighted ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Handle%20comments%20in%20parameter%20names%20(T69657))).
1. HTML tags break the template syntax ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Break%20on%20%7C%20in%20element%20attribute%20name%20in%20template)).
1. External links break the template syntax ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Plain%20link%20in%20template%20argument)).
1. Parameter names of `#invoke` are not highlighted ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Scribunto%3A%20getAllArgs)).

### Heading

1. Multi-line trailing comments break section headings ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Single-line%20or%20multiline-comments%20can%20follow%20headings)).

### HTML tag

1. Disallowed HTML tags should not be highlighted ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#T255007%3A%20French%20spacing%20in%20raw%20text%20elements)).
1. Complex HTML tag attributes are not supported ([`<noinclude>`/`<includeonly>`](https://bhsd-harry.github.io/monaco-wiki/tests.html#3.%20includeonly%20in%20part%20of%20an%20attr%20value), [templates](https://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20HTML%20Tag%3A%202.%20Generation%20of%20HTML%20attr.%20value) or [HTML tags](http://bhsd-harry.github.io/monaco-wiki/tests.html#Extension%20tag%20in%20attribute%20value)).

### Table

1. Interaction between table cells and `<nowiki>` is highlighted incorrectly ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Cases%20where%20%22!!%22%20needs%20nowiki%20protection)).
1. Complex table attributes are not supported ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Table%20cell%20with%20attribute%20before%20expanded%20attribute)).
1. Comments at the SOL break table syntax ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#3c.%20Table%20cells%20without%20escapable%20prefixes%20after%20edits)).

### Link

1. Multiline link targets should be invalid ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Wikilinks%20with%20embedded%20newlines%20are%20not%20broken)).
1. A bracket pair inside link text is highlighted incorrectly ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Piped%20link%20with%20extlink-like%20text)).
1. Link targets with templates may be highlighted incorrectly ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Links%3A%203.%20Generation%20of%20part%20of%20a%20link%20href)).

### Apostrophe

1. Mixing bold and italic apostrophes ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Another%20italics%20%2F%20bold%20test)).

### External link

1. External links are not XML tags ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Pseudo-tag%20with%20URL%20'name'%20renders%20as%20url%20link)).
1. External links cannot be nested in links ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#T4095%3A%20link%20with%20pipe%20and%20three%20closing%20brackets%2C%20version%202)).

### Block element

1. Preformatted text with a leading space is not supported.
1. One-line definition lists are not supported ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Definition%20list%20code%20coverage)).
1. Comments at the SOL break the highlighting ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#1.%20Lists%20with%20start-of-line-transparent%20tokens%20before%20bullets%3A%20Comments)).
