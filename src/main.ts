/* eslint-disable @typescript-eslint/no-require-imports */
import {shikiToMonaco} from '@shikijs/monaco';
import monokai from 'shiki/themes/monokai.mjs';
import nord from 'shiki/themes/nord.mjs';
import getHighlighter from './token.ts';
import wikitext from './wikitext.tmLanguage.ts';
import getLinter from './linter.ts';
import completion from './completion.ts';
import {referenceProvider, highlightProvider, renameProvider} from './reference.ts';
import colorProvider from './color.ts';
import {listen} from './tree.ts';
import foldProvider from './fold.ts';
import type {Config} from 'wikiparser-node';
import type * as Monaco from 'monaco-editor';
import type {IWikitextModel} from './linter.ts';

const config: Monaco.languages.LanguageConfiguration = require('../vendor/language-configuration.json'),
	defaultConfig: Config = require('wikiparser-node/config/default.json');

export default async (monaco: typeof Monaco, parserConfig: Config | boolean = false): Promise<void> => {
	// 注册语言
	const tempConfig = typeof parserConfig === 'object' ? parserConfig : defaultConfig,
		highlighter = await getHighlighter(wikitext, tempConfig, [monokai, nord]);
	monaco.languages.register({id: 'wikitext', aliases: ['Wikitext', 'mediawiki', 'MediaWiki', 'wiki']});
	monaco.languages.register({id: 'javascript', aliases: ['JavaScript', 'js']});
	monaco.languages.register({id: 'css', aliases: ['CSS']});
	monaco.languages.register({id: 'html', aliases: ['HTML', 'htm', 'xhtml']});
	monaco.languages.register({id: 'json', aliases: ['JSON']});
	shikiToMonaco(highlighter, monaco);

	// 注册语言服务
	config.autoClosingPairs!.push(
		...[tempConfig.ext, tempConfig.html.slice(0, 2)].flat(2).map(tag => ({open: `<${tag}>`, close: `</${tag}>`})),
	);
	monaco.languages.setLanguageConfiguration('wikitext', config);
	monaco.languages.registerCompletionItemProvider('wikitext', completion(monaco));
	monaco.languages.registerReferenceProvider('wikitext', referenceProvider(monaco));
	monaco.languages.registerDocumentHighlightProvider('wikitext', highlightProvider(monaco));
	monaco.languages.registerColorProvider('wikitext', colorProvider(monaco));
	monaco.languages.registerRenameProvider('wikitext', renameProvider(monaco));
	monaco.languages.registerFoldingRangeProvider('wikitext', foldProvider);
	monaco.editor.onDidCreateModel((model: IWikitextModel) => {
		getLinter(monaco, model, parserConfig || defaultConfig);
		listen(model);
	});
};
