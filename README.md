# Monaco-Wiki

[![npm version](https://badge.fury.io/js/monaco-wiki.svg)](https://www.npmjs.com/package/monaco-wiki)
[![CodeQL](https://github.com/bhsd-harry/monaco-wiki/actions/workflows/codeql.yml/badge.svg)](https://github.com/bhsd-harry/monaco-wiki/actions/workflows/github-code-scanning/codeql)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/18f690b061a64d40ad0d8bec1f5489e3)](https://app.codacy.com/gh/bhsd-harry/monaco-wiki/dashboard)

**Monaco-Wiki** registers the [Wikitext](https://www.mediawiki.org/wiki/Wikitext) language in the [Monaco Editor](https://microsoft.github.io/monaco-editor/). It is a web version of the Visual Studio Code extensions developed by [Rowe Wilson Frederisk Holme](https://marketplace.visualstudio.com/items?itemName=RoweWilsonFrederiskHolme.wikitext) and [Bhsd](https://marketplace.visualstudio.com/items?itemName=Bhsd.vscode-extension-wikiparser). The TextMate grammar is substantially revised to be site-specific and more accurate.

## Installation

```bash
npm install monaco-wiki
```

## Usage

You may load the Monaco Editor and prepare the bundle on your own:

```js
import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor/+esm';
import light from 'shiki/themes/github-light.mjs';
import registerWiki, {
	registerJavaScript,
	registerCSS,
	registerLua,
	registerVue,
} from 'monaco-wiki';

await registerWiki(
	monaco,

	// Set to `true` if used in a MediaWiki site,
	// or a string to specify a preset configuration (https://github.com/bhsd-harry/wikiparser-node/tree/main/config)
	false,

	// (optional) i18n language codes with a preferred order,
	// e.g. `['zh-hans', 'zh-hant', 'en']
	['en'],

	// (optional) custom download URL for the `wikiparse` object`
	'https://cdn.jsdelivr.net/npm/wikiparser-node',

	// (optional) Shiki themes
	[light],

	// (optional) WikiLint options
	{
		// `0` ignores all, `1` ignores warnings, `2` reports all (default)
		defaultSeverity: 1,
		// Rules are listed at https://github.com/bhsd-harry/wikiparser-node/wiki/Rules
		'no-arg': 0,
	},
);

registerJavaScript(
	monaco,

	// (optional) custom download URL for the `eslint` object`
	'https://cdn.jsdelivr.net/npm/@bhsd/eslint-browserify',

	// (optional) ESLint options
	// See https://eslint.org/docs/v8.x/use/configure/
	{
		parserOptions: {
			sourceType: 'module',
		},
	},
);

registerCSS(
	monaco,

	// (optional) custom download URL for the `stylelint` object`
	'https://cdn.jsdelivr.net/npm/@bhsd/stylelint-browserify',

	// (optional) Stylelint options
	// See https://stylelint.io/user-guide/configure/
	{
		rules: {
			'length-zero-no-unit': true,
		},
	},
);

registerLua(
	monaco,

	// (optional) custom download URL for the `luacheck` object`
	'https://cdn.jsdelivr.net/npm/luacheck-browserify',

	// (optional) Luacheck options
	// See https://luacheck.readthedocs.io/en/stable/config.html#config-options
	{
		std: 'mediawiki',
	},
);

await registerVue(
	monaco,

	// (optional) Shiki themes
	[light],
);
```

or simply load the pre-bundled version from a CDN:

```js
// Optionally specify the jsDelivr CDN, defaulting to https://fastly.jsdelivr.net
window.monaco = {CDN: 'https://cdn.jsdelivr.net'};
// Automatically loads the Monaco Editor's core and relevant workers
await import('https://cdn.jsdelivr.net/npm/monaco-wiki/dist/all.min.js');
await monaco; // The global `monaco` is a promise that resolves to the Monaco editor
```

## Language Aliases

- wikitext
- wiki
- mediawiki

## Bundled Themes

|Name|ID|
|:-:|:-:|
|Light+|`light-plus`|
|Monokai|`monokai`|

## Known Issues

### Syntax Highlighting

<details>
	<summary>Expand</summary>

#### Redirect

1. Redirect is only allowed at the beginning of a page ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Redirect%20syntax%20under%20text%20isn't%20considered%20a%20redirect)).

#### Extension

1. Legacy syntax of `<tvar>` tags is not supported ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Old%20tvar%20syntax%20should%20not%20break%20too%20hard.)).
1. Nested language in `<syntaxhighlight>` ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#tabs%20plus%20tidy%20(T32930%2C%20T59826))).
1. `<nowiki>` tags inside `<pre>` are not supported ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#%3Cpre%3E%20with%20%3Cnowiki%3E%20inside%20(compatibility%20with%201.6%20and%20earlier))).
1. Multiline extension tags (Examples [1](https://bhsd-harry.github.io/monaco-wiki/tests.html#Check%20Cite%20handing%20of%20linefeed%20whitespace%20in%20reference%20names), [2](https://bhsd-harry.github.io/monaco-wiki/tests.html#Gallery%20with%20wikitext%20inside%20gallery%20caption)).
1. Extension tags containing unclosed comments ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Ref%3A%209.%20unclosed%20comments%20should%20not%20leak%20out%20of%20ref-body)).
1. Extension tags cannot be nested in same tags ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Ref%3A%2014.%20A%20nested%20ref-tag%20should%20be%20emitted%20as%20plain%20text)).

#### Transclusion

1. [Bracket pair colorization](https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IEditorOptions.html#bracketPairColorization) is problematic ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#T53961%3A%20Output%20correct%20nowikis%20in%20template%20arguments)), especially for 4 consecutive braces ([left](https://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%20with%20templated%20name) or [right braces](https://bhsd-harry.github.io/monaco-wiki/tests.html#Template%20with%20just%20whitespace%20in%20it%2C%20T70421)).
1. Substitution is not correctly highlighted ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Scribunto%3A%20isSubsting%20during%20PST)).
1. Non-existing parser functions starting with `#` are highlighted as parser functions ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Parsoid%3A%20unknown%20parser%20function%20(T314524))).
1. Multiline template names should be invalid ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Don't%20recognize%20targets%20split%20by%20newlines)).
1. Template names containing comments are not highlighted ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Handle%20comments%20in%20the%20target)).
1. Template parameter names containing newlines or comments are not highlighted ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Handle%20comments%20in%20parameter%20names%20(T69657))).
1. HTML tags break the template syntax ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Break%20on%20%7C%20in%20element%20attribute%20name%20in%20template)).
1. External links break the template syntax ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Plain%20link%20in%20template%20argument)).
1. Parameter names of `#invoke` are not highlighted ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Scribunto%3A%20getAllArgs)).
1. Conflict between transclusion and language conversion syntax ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Parser%20function%20inside%20dl-dt%20list%20should%20be%20tokenized%20correctly)).

#### Heading

1. Multiline trailing comments break section headings ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Single-line%20or%20multiline-comments%20can%20follow%20headings)).
1. Section headings containing multiline extension tags are not highlighted ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Heading%20with%20line%20break%20in%20nowiki)).

#### HTML tag

1. Complex HTML tag attributes are not supported ([comments](https://bhsd-harry.github.io/monaco-wiki/tests.html#Comment%20in%20attribute), [`<noinclude>`/`<includeonly>`](https://bhsd-harry.github.io/monaco-wiki/tests.html#3.%20includeonly%20in%20part%20of%20an%20attr%20value), [templates](https://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20HTML%20Tag%3A%202.%20Generation%20of%20HTML%20attr.%20value) or [HTML tags](https://bhsd-harry.github.io/monaco-wiki/tests.html#Extension%20tag%20in%20attribute%20value)).
1. HTML tag attributes cannot contain `>` ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Tags%20with%20parameters%20in%20TOC)).
1. Disallowed HTML attributes should not be highlighted ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#%3Cpre%3E%20with%20forbidden%20attribute%20(T5202))).

#### Table

1. Interaction between table cells and `<nowiki>` is highlighted incorrectly ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Cases%20where%20%22!!%22%20needs%20nowiki%20protection)).
1. Interaction between table cells and templates is highlighted incorrectly ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Accept%20%22!!%22%20in%20templates)).
1. Interaction between table cells and HTML tags is highlighted incorrectly ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Element%20attributes%20with%20double%20!%20should%20not%20be%20broken%20up%20by%20%3Cth%3E)).
1. Interaction between table cells and comments is highlighted incorrectly ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Wikitext%20table%20with%20a%20lot%20of%20comments)).
1. Complex table attributes are not supported ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Table%20cell%20with%20attribute%20before%20expanded%20attribute)).
1. Comments at the SOL break table syntax ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#3c.%20Table%20cells%20without%20escapable%20prefixes%20after%20edits)).
1. `||`/`!!` after templates are not highlighted ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Multi-line%20transclusions%20should%20not%20interrupt%20table-cell%20parsing%20in%20the%20same%20row)).

#### Link

1. Multiline link targets should be invalid ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Wikilinks%20with%20embedded%20newlines%20are%20not%20broken)).
1. A bracket pair inside link text is highlighted incorrectly ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Piped%20link%20with%20extlink-like%20text)).
1. Link targets with templates may be highlighted incorrectly ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Links%3A%203.%20Generation%20of%20part%20of%20a%20link%20href)).
1. Lonely `[[` breaks highlighting ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Non-wikilinks%20with%20html%20tags%20in%20target%20position)).
1. Lists cannot be nested in file links ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Image%3A%20caption%20containing%20a%20newline)).

#### Apostrophe

1. Mixing bold and italic apostrophes ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Another%20italics%20%2F%20bold%20test)).

#### External link

1. External links are not XML tags ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Pseudo-tag%20with%20URL%20'name'%20renders%20as%20url%20link)).
1. External links cannot be nested in links ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#T4095%3A%20link%20with%20pipe%20and%20three%20closing%20brackets%2C%20version%202)).
1. Magic links cannot be nested in links ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#WTS%20of%20magic%20word%20text%20(T109371))).

#### Block element

1. Preformatted text with a leading space is not supported.
1. One-line definition lists are not supported ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Definition%20list%20code%20coverage)).
1. Comments at the SOL break the highlighting ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#1.%20Lists%20with%20start-of-line-transparent%20tokens%20before%20bullets%3A%20Comments)).

#### Language conversion

1. BCP 47 language codes are not supported in language conversion ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Explicit%20definition%20of%20language%20variant%20alternatives%20(BCP%2047%20codes))).
1. Interaction with `<nowiki>` ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Language%20converter%20tricky%20html2wt%20cases%20(5))).

</details>
