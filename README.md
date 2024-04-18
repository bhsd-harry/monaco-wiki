# Monaco-Wiki

[![npm version](https://badge.fury.io/js/monaco-wiki.svg)](https://www.npmjs.com/package/monaco-wiki)
[![CodeQL](https://github.com/bhsd-harry/monaco-wiki/actions/workflows/codeql.yml/badge.svg)](https://github.com/bhsd-harry/monaco-wiki/actions/workflows/github-code-scanning/codeql)

**Monaco-Wiki** registers the [Wikitext](https://www.mediawiki.org/wiki/Wikitext) language in the [Monaco Editor](https://microsoft.github.io/monaco-editor/). It is a web version of the [Visual Studio Code](https://code.visualstudio.com/) [extension](https://github.com/Frederisk/Wikitext-VSCode-Extension) developed by Rowe Wilson Frederisk Holme.

## Usage

```js
import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor/+esm';
import registerWiki from 'https://cdn.jsdelivr.net/npm/monaco-wiki';

registerWiki(
	monaco,
	false, // Set to `true` if used in a MediaWiki site
);
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

[GNU General Public License 3.0](https://www.gnu.org/licenses/gpl-3.0-standalone.html)
