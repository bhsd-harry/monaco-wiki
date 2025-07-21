/* eslint-disable @typescript-eslint/no-require-imports */
import {shikiToMonaco} from '@shikijs/monaco';
import {getWikiparse, getLSP} from '@bhsd/browser';
import {getMwConfig, getParserConfig} from '@bhsd/codemirror-mediawiki/dist/mwConfig.js';
import getHighlighter from './token.ts';
import wikitext from './wikitext.tmLanguage.ts';
import registerLinterBase from './linter.ts';
import {registerWikiLint, registerESLint, registerStylelint, registerLuacheck} from './linters.ts';
import addKeybindings from './keymap.ts';
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
	codeActionProvider,
} from './lsp.ts';
import type {ConfigData} from 'wikiparser-node';
import type {} from 'wikiparser-node/extensions/typings.ts';
import type * as Monaco from 'monaco-editor';
import type {languages} from 'monaco-editor';
import type {ThemeRegistrationRaw} from 'shiki';
import type {LiveOption} from './linter.ts';

/**
 * Register the language service for Wikitext
 * @param monaco Monaco Editor global
 * @param parserConfig Configuration for [WikiParser-Node](https://github.com/bhsd-harry/wikiparser-node).
 * Please set this to `true` if used in a MediaWiki site.
 * @param langs i18n language codes with a preferred order
 * @param cdn CDN URL for downloading WikiParser-Node, default to https://testingcf.jsdelivr.net/npm/wikiparser-node
 * @param themes Additional Shiki themes
 * @param opt WikiLint options.
 */
export default async (
	monaco: typeof Monaco,
	parserConfig?: ConfigData | string | boolean,
	langs?: string | string[],
	cdn?: string,
	themes: ThemeRegistrationRaw[] = [],
	opt?: LiveOption,
): Promise<void> => {
	// 加载 WikiParser-Node
	const loaded = typeof wikiparse === 'object';
	const getConfig = async (): Promise<ConfigData> => {
		if (typeof parserConfig === 'object') {
			return parserConfig;
		} else if (parserConfig && typeof parserConfig !== 'string') { // MW网站
			const minConfig = await wikiparse.getConfig();
			let articlePath = mw.config.get('wgArticlePath');
			if (/^\/(?!\/)/u.test(articlePath)) {
				articlePath = location.origin + articlePath;
			}
			return {
				...loaded ? minConfig : getParserConfig(minConfig, await getMwConfig({})),
				articlePath,
			};
		}
		return (await fetch(`${wikiparse.CDN}/config/${parserConfig || 'default'}.json`)).json();
	};
	await getWikiparse(getConfig, langs, cdn);

	const wikiConfig = await wikiparse.getConfig();
	// 注册语言
	monaco.languages.register({id: 'wikitext', aliases: ['Wikitext', 'mediawiki', 'MediaWiki', 'wiki']});
	monaco.languages.register({id: 'javascript', aliases: ['JavaScript', 'js']});
	monaco.languages.register({id: 'css', aliases: ['CSS']});
	monaco.languages.register({id: 'html', aliases: ['HTML', 'htm', 'xhtml']});
	monaco.languages.register({id: 'json', aliases: ['JSON']});
	shikiToMonaco(await getHighlighter(wikitext, wikiConfig, themes), monaco);

	const config: languages.LanguageConfiguration = require('../vendor/language-configuration.json');
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
	monaco.languages.registerLinkProvider({language: 'wikitext', exclusive: true}, linkProvider);
	monaco.languages.registerHoverProvider('wikitext', hoverProvider);
	monaco.languages.registerSignatureHelpProvider('wikitext', signatureHelpProvider);
	monaco.languages.registerInlayHintsProvider('wikitext', inlayHintsProvider);
	monaco.languages.registerCodeActionProvider('wikitext', codeActionProvider);
	addKeybindings(monaco);
	registerLinterBase(monaco);
	registerWikiLint(opt);
	monaco.editor.onWillDisposeModel(model => {
		getLSP(model)?.destroy();
	});
};

/**
 * Register ESLint for JavaScript
 * @param monaco Monaco Editor global
 * @param cdn CDN URL for downloading ESLint, default to https://testingcf.jsdelivr.net/npm/@bhsd/eslint-browserify
 * @param opt ESLint options
 */
export const registerJavaScript = (monaco: typeof Monaco, cdn?: string, opt?: LiveOption): void => {
	monaco.languages.registerCodeActionProvider('javascript', codeActionProvider);
	registerLinterBase(monaco);
	registerESLint(cdn, opt);
};

/**
 * Register Stylelint for CSS
 * @param monaco Monaco Editor global
 * @param cdn CDN URL for downloading Stylelint,
 * default to https://testingcf.jsdelivr.net/npm/@bhsd/stylelint-browserify
 * @param opt Stylelint options
 */
export const registerCSS = (monaco: typeof Monaco, cdn?: string, opt?: LiveOption): void => {
	monaco.languages.registerCodeActionProvider('css', codeActionProvider);
	registerLinterBase(monaco);
	registerStylelint(cdn, opt);
};

/**
 * Register the Luacheck for Lua
 * @param monaco Monaco Editor global
 * @param cdn CDN URL for downloading Luacheck, default to https://testingcf.jsdelivr.net/npm/luacheck-browserify
 */
export const registerLua = (monaco: typeof Monaco, cdn?: string): void => {
	registerLinterBase(monaco);
	registerLuacheck(cdn);
};
