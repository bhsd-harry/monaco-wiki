# Monaco-Wiki

[![npm version](https://badge.fury.io/js/monaco-wiki.svg)](https://www.npmjs.com/package/monaco-wiki)
[![CodeQL](https://github.com/bhsd-harry/monaco-wiki/actions/workflows/codeql.yml/badge.svg)](https://github.com/bhsd-harry/monaco-wiki/actions/workflows/github-code-scanning/codeql)
[![codebeat badge](https://codebeat.co/badges/f4c13c9f-91c7-4cf8-a6f2-7c99e9209810)](https://codebeat.co/projects/github-com-bhsd-harry-monaco-wiki-main)

**Monaco-Wiki** registers the [Wikitext](https://www.mediawiki.org/wiki/Wikitext) language in the [Monaco Editor](https://microsoft.github.io/monaco-editor/). It is a web version of the [Visual Studio Code](https://code.visualstudio.com/) extensions developed by [Rowe Wilson Frederisk Holme](https://github.com/Frederisk/Wikitext-VSCode-Extension) and [Bhsd](https://github.com/bhsd-harry/vscode-extension-wikiparser). The TextMate grammar is substantially revised to be site-specific and more accurate.

## Usage

You may load the Monaco Editor on your own:

```js
import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor/+esm';
import registerWiki from 'https://cdn.jsdelivr.net/npm/monaco-wiki';

await registerWiki(
	monaco,
	false, // Set to `true` if used in a MediaWiki site
);
```

or simply:

```js
// Automatically loads the Monaco Editor's core and relevant workers
import 'https://cdn.jsdelivr.net/npm/monaco-wiki/dist/all.min.js';

await monaco; // The global `monaco` is a promise that resolves to the Monaco editor
```

## Language Aliases

- wikitext
- wiki
- mediawiki

## Themes

|Name|ID|
|:-:|:-:|
|Monokai|`monokai`|
|Nord|`nord`|

If you wish to use other themes listed [here](https://shiki.style/themes), please [submit a feature request](https://github.com/bhsd-harry/monaco-wiki/issues/new).

## Known Issues

### Syntax Highlighting

1. Preformatted text with a leading space is not supported.
1. [Bracket pair colorization](https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IEditorOptions.html#bracketPairColorization) is imperfect for Wikitext ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#T53961%3A%20Output%20correct%20nowikis%20in%20template%20arguments)), especially for 4 consecutive braces (Examples [1](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Parsoid%20parameter%20escaping%20test%201), [2](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20'%3D'%20char%20in%20nested%20transclusions%20should%20not%20trigger%20nowiki%20escapes%20or%20conversion%20to%20named%20param)).
1. Not error-tolerant ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Target%20with%20an%20extension%20tag)).
1. Interaction between table cells and `<nowiki>` ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Cases%20where%20%22!!%22%20needs%20nowiki%20protection)).
1. Disallowed HTML tags ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#T255007%3A%20French%20spacing%20in%20raw%20text%20elements)).
1. Multiline template names ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Don't%20recognize%20targets%20split%20by%20newlines)) and link targets ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Wikilinks%20with%20embedded%20newlines%20are%20not%20broken)).
1. Template names containing comments (Examples [1](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Recognize%20targets%20when%20newlines%20and%20comments%20don't%20split%20the%20target), [2](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Handle%20comments%20in%20the%20target)).
1. Template parameter names containing newlines or comments ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Handle%20comments%20in%20parameter%20names%20(T69657))).
1. Wikitext in template parameter names ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Other%20wikitext%20in%20parameter%20names%20(T69657))).
1. HTML tag breaking template syntax (Examples [1](http://bhsd-harry.github.io/monaco-wiki/tests.html#Break%20on%20%7C%20in%20element%20attribute%20in%20template), [2](http://bhsd-harry.github.io/monaco-wiki/tests.html#Break%20on%20%7C%20in%20element%20attribute%20name%20in%20template)).
1. 3 consecutive brackets (Examples [1](http://bhsd-harry.github.io/monaco-wiki/tests.html#Link%20with%203%20brackets), [2](http://bhsd-harry.github.io/monaco-wiki/tests.html#Piped%20link%20with%203%20brackets)).

## License

[GNU General Public License 3.0](https://www.gnu.org/licenses/gpl-3.0-standalone.html)
