/* eslint-disable @typescript-eslint/no-require-imports */
import {shikiToMonaco} from '@shikijs/monaco';
import monokai from 'shiki/themes/monokai.mjs';
import nord from 'shiki/themes/nord.mjs';
import {loadScript, getLSP} from '@bhsd/common';
// @ts-expect-error ESM
import {getMwConfig, getParserConfig} from '@bhsd/codemirror-mediawiki/dist/mwConfig.mjs';
import getHighlighter from './token.ts';
import wikitext from './wikitext.tmLanguage.ts';
import getLinter from './linter.ts';
import {
	documentColorProvider,
	completionItemProvider,
	foldingRangeProvider,
	linkProvider,
	referenceProvider,
	documentHighlightProvider,
	definitionProvider,
	renameProvider,
	hoverProvider,
	signatureHelpProvider,
	inlayHintsProvider,
} from './lsp.ts';
import type {ConfigData} from 'wikiparser-node';
import type * as Monaco from 'monaco-editor';
import type {languages} from 'monaco-editor';

const config: languages.LanguageConfiguration = require('../vendor/language-configuration.json');

export default async (monaco: typeof Monaco, parserConfig?: ConfigData | boolean): Promise<void> => {
	// 加载 WikiParser-Node
	const DIR = 'npm/wikiparser-node/extensions/dist',
		loaded = typeof wikiparse === 'object';
	await loadScript(`${DIR}/base.min.js`, 'wikiparse');
	await loadScript(`${DIR}/lsp.min.js`, 'wikiparse.LanguageService');
	let wikiConfig: ConfigData;
	if (typeof parserConfig === 'object') {
		wikiConfig = parserConfig;
	} else if (parserConfig) { // MW网站
		const minConfig = await wikiparse.getConfig();
		wikiConfig = loaded ? minConfig : getParserConfig(minConfig, await getMwConfig());
		let articlePath = mediaWiki.config.get('wgArticlePath');
		if (/^\/(?!\/)/u.test(articlePath)) {
			articlePath = location.origin + articlePath;
		}
		Object.assign(wikiConfig, {articlePath});
	} else {
		wikiConfig = await (await fetch(`${wikiparse.CDN}/config/default.json`)).json();
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
			.map((tag): languages.IAutoClosingPairConditional => ({open: `<${tag}>`, close: `</${tag}>`})),
	);
	monaco.languages.setLanguageConfiguration('wikitext', config);

	// 注册语言服务
	monaco.languages.registerCompletionItemProvider('wikitext', completionItemProvider(monaco));
	monaco.languages.registerReferenceProvider('wikitext', referenceProvider);
	monaco.languages.registerDocumentHighlightProvider('wikitext', documentHighlightProvider);
	monaco.languages.registerDefinitionProvider('wikitext', definitionProvider);
	monaco.languages.registerColorProvider('wikitext', documentColorProvider);
	monaco.languages.registerRenameProvider('wikitext', renameProvider);
	monaco.languages.registerFoldingRangeProvider('wikitext', foldingRangeProvider);
	monaco.languages.registerLinkProvider('wikitext', linkProvider);
	monaco.languages.registerHoverProvider('wikitext', hoverProvider);
	monaco.languages.registerSignatureHelpProvider('wikitext', signatureHelpProvider);
	monaco.languages.registerInlayHintsProvider('wikitext', inlayHintsProvider);
	monaco.editor.onDidCreateModel(model => {
		getLinter(monaco, model);
	});
	monaco.editor.onWillDisposeModel(model => {
		getLSP(model)?.destroy();
	});
};
