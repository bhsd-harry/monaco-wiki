import {createHighlighterCore} from 'shiki/core';
import javascript from 'shiki/langs/javascript.mjs';
import css from 'shiki/langs/css.mjs';
import html from 'shiki/langs/html.mjs';
import loadWasm from 'shiki/wasm';
import monokai from 'shiki/themes/monokai.mjs';
import nord from 'shiki/themes/nord.mjs';
import {shikiToMonaco} from '@shikijs/monaco';
import getLinter from './linter.ts';
import completion from './completion.ts';
import referenceProvider from './reference.ts';
import colorProvider from './color.ts';
import {listen} from './tree.ts';
import 'wikiparser-node/extensions/typings.d.ts';
import type {Config} from 'wikiparser-node';
import type * as Monaco from 'monaco-editor';
import type {LanguageInput} from 'shiki/core';
import type {IWikitextModel} from './linter.ts';

const wikitext: LanguageInput = require('../vendor/wikitext.tmLanguage.json'),
	config: Monaco.languages.LanguageConfiguration = require('../vendor/language-configuration.json'),
	defaultConfig: Config = require('wikiparser-node/config/default.json');

const registerWiki = async (monaco: typeof Monaco, parserConfig: Config | boolean = false): Promise<void> => {
	const tempConfig = typeof parserConfig === 'object' ? parserConfig : defaultConfig;
	config.autoClosingPairs!.push(
		...[tempConfig.ext, tempConfig.html.slice(0, 2)].flat(2).map(tag => ({open: `<${tag}>`, close: `</${tag}>`})),
	);
	const highlighter = await createHighlighterCore({
		langs: [
			wikitext,
			javascript,
			css,
			html,
		],
		themes: [
			monokai,
			nord,
		],
		loadWasm,
	});
	monaco.languages.register({id: 'wikitext', aliases: ['wiki', 'mediawiki']});
	monaco.languages.register({id: 'javascript', aliases: ['JavaScript', 'js']});
	monaco.languages.register({id: 'css', aliases: ['CSS']});
	monaco.languages.register({id: 'html', aliases: ['HTML', 'htm', 'xhtml']});
	shikiToMonaco(highlighter, monaco);
	monaco.languages.setLanguageConfiguration('wikitext', config);
	monaco.languages.registerCompletionItemProvider('wikitext', completion(monaco));
	monaco.languages.registerReferenceProvider('wikitext', referenceProvider);
	monaco.languages.registerColorProvider('wikitext', colorProvider(monaco));

	monaco.editor.onDidCreateModel((model: IWikitextModel) => {
		getLinter(monaco, model, parserConfig || defaultConfig);
		listen(model);
	});
};

export default registerWiki;
