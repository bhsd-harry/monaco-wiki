# Monaco-Wiki

[![npm version](https://badge.fury.io/js/monaco-wiki.svg)](https://www.npmjs.com/package/monaco-wiki)
[![CodeQL](https://github.com/bhsd-harry/monaco-wiki/actions/workflows/codeql.yml/badge.svg)](https://github.com/bhsd-harry/monaco-wiki/actions/workflows/github-code-scanning/codeql)
[![codebeat badge](https://codebeat.co/badges/f4c13c9f-91c7-4cf8-a6f2-7c99e9209810)](https://codebeat.co/projects/github-com-bhsd-harry-monaco-wiki-main)

**Monaco-Wiki** registers the [Wikitext](https://www.mediawiki.org/wiki/Wikitext) language in the [Monaco Editor](https://microsoft.github.io/monaco-editor/). It is a web version of the [Visual Studio Code](https://code.visualstudio.com/) extensions developed by [Rowe Wilson Frederisk Holme](https://github.com/Frederisk/Wikitext-VSCode-Extension) and [Bhsd](https://github.com/bhsd-harry/vscode-extension-wikiparser).

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

[GNU General Public License 3.0](https://www.gnu.org/licenses/gpl-3.0-standalone.html)
