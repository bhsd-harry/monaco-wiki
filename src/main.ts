/* eslint-disable @typescript-eslint/no-require-imports */
import {shikiToMonaco} from '@shikijs/monaco';
import monokai from 'shiki/themes/monokai.mjs';
import nord from 'shiki/themes/nord.mjs';
import {loadScript} from '@bhsd/common';
// @ts-expect-error ESM
import {getMwConfig, getParserConfig} from '@bhsd/codemirror-mediawiki/dist/mwConfig.mjs';
import getHighlighter from './token.ts';
import wikitext from './wikitext.tmLanguage.ts';
import getLinter from './linter.ts';
import completion from './completion.ts';
import {referenceProvider, highlightProvider, definitionProvider, renameProvider} from './reference.ts';
import colorProvider from './color.ts';
import foldProvider from './fold.ts';
import linkProvider from './link.ts';
import type {Config} from 'wikiparser-node';
import type * as Monaco from 'monaco-editor';
import type {languages} from 'monaco-editor';
import type {IWikitextModel} from './linter.ts';

const config: languages.LanguageConfiguration = require('../vendor/language-configuration.json'),
	defaultConfig: Config = require('wikiparser-node/config/default.json');

export default async (monaco: typeof Monaco, parserConfig?: Config | boolean): Promise<void> => {
	// 加载 WikiParser-Node
	const DIR = `npm/wikiparser-node/extensions/dist`,
		loaded = 'wikiparse' in globalThis;
	await loadScript(`${DIR}/base.min.js`, 'wikiparse');
	await loadScript(`${DIR}/lsp.min.js`, 'wikiparse.LanguageService');
	let wikiConfig: Config;
	if (typeof parserConfig === 'object') {
		wikiConfig = parserConfig;
	} else if (loaded) {
		wikiConfig = await wikiparse.getConfig();
	} else {
		wikiConfig = parserConfig ? getParserConfig(await wikiparse.getConfig(), await getMwConfig()) : defaultConfig;
	}
	if (typeof mediaWiki === 'object') {
		let articlePath = mediaWiki.config.get('wgArticlePath');
		if (/^\/(?!\/)/u.test(articlePath)) {
			articlePath = location.origin + articlePath;
		}
		Object.assign(wikiConfig, {articlePath});
	}
	wikiparse.setConfig(wikiConfig);

	// 注册语言
	monaco.languages.register({id: 'wikitext', aliases: ['Wikitext', 'mediawiki', 'MediaWiki', 'wiki']});
	monaco.languages.register({id: 'javascript', aliases: ['JavaScript', 'js']});
	monaco.languages.register({id: 'css', aliases: ['CSS']});
	monaco.languages.register({id: 'html', aliases: ['HTML', 'htm', 'xhtml']});
	monaco.languages.register({id: 'json', aliases: ['JSON']});
	shikiToMonaco(await getHighlighter(wikitext, wikiConfig, [monokai, nord]), monaco);

	// 语言设置
	config.autoClosingPairs!.push(
		...[wikiConfig.ext, wikiConfig.html.slice(0, 2)].flat(2)
			.map(tag => ({open: `<${tag}>`, close: `</${tag}>`}) satisfies languages.IAutoClosingPairConditional),
	);
	monaco.languages.setLanguageConfiguration('wikitext', config);

	// 注册语言服务
	monaco.languages.registerCompletionItemProvider('wikitext', completion(monaco));
	monaco.languages.registerReferenceProvider('wikitext', referenceProvider);
	monaco.languages.registerDocumentHighlightProvider('wikitext', highlightProvider);
	monaco.languages.registerDefinitionProvider('wikitext', definitionProvider);
	monaco.languages.registerColorProvider('wikitext', colorProvider);
	monaco.languages.registerRenameProvider('wikitext', renameProvider);
	monaco.languages.registerFoldingRangeProvider('wikitext', foldProvider);
	monaco.languages.registerLinkProvider('wikitext', linkProvider);
	monaco.editor.onDidCreateModel((model: IWikitextModel) => {
		getLinter(monaco, model);
	});
};
