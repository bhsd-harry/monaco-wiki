import {getHighlighterCore} from 'shiki/core';
import loadWasm from 'shiki/wasm';
import monokai from 'shiki/themes/monokai.mjs';
import {shikiToMonaco} from '@shikijs/monaco';
import type * as Monaco from 'monaco-editor';

const wikitext = require('../vendor/wikitext.tmLanguage.json'),
	config: Monaco.languages.LanguageConfiguration = require('../vendor/language-configuration.json');

export const registerWiki = async (monaco: typeof Monaco): Promise<void> => {
	const highlighter = await getHighlighterCore({
		langs: [wikitext],
		themes: [monokai],
		loadWasm,
	});
	monaco.languages.register({id: 'wikitext', aliases: ['wiki', 'mediawiki']});
	shikiToMonaco(highlighter, monaco);
	monaco.languages.setLanguageConfiguration('wikitext', config);
};
