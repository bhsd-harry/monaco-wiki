# Monaco-Wiki

[![npm version](https://badge.fury.io/js/monaco-wiki.svg)](https://www.npmjs.com/package/monaco-wiki)
[![CodeQL](https://github.com/bhsd-harry/monaco-wiki/actions/workflows/codeql.yml/badge.svg)](https://github.com/bhsd-harry/monaco-wiki/actions/workflows/github-code-scanning/codeql)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/18f690b061a64d40ad0d8bec1f5489e3)](https://app.codacy.com/gh/bhsd-harry/monaco-wiki/dashboard)

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
1. Free external links are not supported.
1. [Bracket pair colorization](https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IEditorOptions.html#bracketPairColorization) is imperfect for Wikitext ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#T53961%3A%20Output%20correct%20nowikis%20in%20template%20arguments)), especially for 4 consecutive braces (Examples [1](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Parsoid%20parameter%20escaping%20test%201), [2](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20'%3D'%20char%20in%20nested%20transclusions%20should%20not%20trigger%20nowiki%20escapes%20or%20conversion%20to%20named%20param)).
1. Not error-tolerant ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Target%20with%20an%20extension%20tag)).
1. Interaction between table cells and `<nowiki>` ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Cases%20where%20%22!!%22%20needs%20nowiki%20protection)).
1. Disallowed HTML tags ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#T255007%3A%20French%20spacing%20in%20raw%20text%20elements)).
1. Multiline template names ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Don't%20recognize%20targets%20split%20by%20newlines)) and link targets ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Wikilinks%20with%20embedded%20newlines%20are%20not%20broken)).
1. Template names containing comments (Examples [1](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Recognize%20targets%20when%20newlines%20and%20comments%20don't%20split%20the%20target), [2](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Handle%20comments%20in%20the%20target)).
1. Template parameter names containing newlines or comments ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Handle%20comments%20in%20parameter%20names%20(T69657))).
1. Wikitext in template parameter names ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20Other%20wikitext%20in%20parameter%20names%20(T69657))).
1. HTML tag breaking template syntax (Examples [1](http://bhsd-harry.github.io/monaco-wiki/tests.html#Break%20on%20%7C%20in%20element%20attribute%20in%20template), [2](http://bhsd-harry.github.io/monaco-wiki/tests.html#Break%20on%20%7C%20in%20element%20attribute%20name%20in%20template)).
1. Bracket pair inside link text ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Piped%20link%20with%20extlink-like%20text)).
1. Double URI encoding in link targets ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Link%20containing%20%25%20as%20a%20double%20hex%20sequence%20interpreted%20to%20hex%20sequence)).
1. Double HTML escaping in link targets ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Link%20containing%20an%20ampersand)).
1. Nested internal link in internal/external links (Examples [1](http://bhsd-harry.github.io/monaco-wiki/tests.html#Nested%20wikilink%20syntax%20in%20wikilink%20syntax%20that%20parses%20as%20wikilink%20in%20extlink), [2](http://bhsd-harry.github.io/monaco-wiki/tests.html#Wikilink%20in%20wikilink)).
1. Interaction between external links and template parameters ([Example](http://bhsd-harry.github.io/monaco-wiki/tests.html#Plain%20link%20in%20template%20argument)).
1. 3 consecutive brackets (Examples [1](https://bhsd-harry.github.io/monaco-wiki/tests.html#Link%20with%203%20brackets), [2](https://bhsd-harry.github.io/monaco-wiki/tests.html#Piped%20link%20with%203%20brackets)).
1. 4 consecutive braces (Examples [1](https://bhsd-harry.github.io/monaco-wiki/tests.html#Parsoid%3A%20Template-generated%20DISPLAYTITLE), [2](https://bhsd-harry.github.io/monaco-wiki/tests.html#Parsoid%20html2wt%20b%2Fc%20check%3A%20Cached%20Parsoid%20HTML%20for%20DISPLAYTITLE%20should%20be%20handled%20properly)).
1. Incomplete external link syntax ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#Broken%20wikilinks%20(but%20not%20external%20links)%20prevent%20templates%20from%20closing)).
1. Comments at the start of a line ([Example](https://bhsd-harry.github.io/monaco-wiki/tests.html#1.%20Lists%20with%20start-of-line-transparent%20tokens%20before%20bullets%3A%20Comments)).
1. Complex HTML tag attributes (Examples [1](https://bhsd-harry.github.io/monaco-wiki/tests.html#2.%20includeonly%20in%20html%20attr%20value), [2](https://bhsd-harry.github.io/monaco-wiki/tests.html#3.%20includeonly%20in%20part%20of%20an%20attr%20value), [3](https://bhsd-harry.github.io/monaco-wiki/tests.html#Templates%3A%20HTML%20Tag%3A%202.%20Generation%20of%20HTML%20attr.%20value)).

## License

[GNU General Public License 3.0](https://www.gnu.org/licenses/gpl-3.0-standalone.html)
