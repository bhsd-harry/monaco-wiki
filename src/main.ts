import {shikiToMonaco} from '@shikijs/monaco';
import {getWikiparse, getLSP, isGlobal} from '@bhsd/browser';
import {getMwConfig, getParserConfig} from '@bhsd/codemirror-mediawiki/mwConfig';
import langConfig from '../vendor/language-configuration.json' with {type: 'json'};
import getHighlighter, {getVueHighlighter} from './token.js';
import wikitext from './wikitext.tmLanguage.js';
import registerLinterBase from './linter.js';
import {registerWikiLint, registerESLint, registerStylelint, registerLuacheck} from './linters.js';
import addKeybindings from './keymap.js';
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
	codeActionProviderForWiki,
} from './lsp.js';
import type {ConfigGetter} from '@bhsd/browser';
import type {LiveOption} from '@bhsd/cm-util';
import type {ConfigData} from 'wikiparser-node';
import type {} from 'wikiparser-node/dist/extensions/typings.d.js';
import type * as Monaco from 'monaco-editor';
import type {languages} from 'monaco-editor';
import type {ThemeRegistrationRaw} from 'shiki';
import type {} from 'types-mediawiki';

declare interface Options {

	/**
	 * CDN URL for downloading the linter
	 * WikiParser-Node defaults to https://fastly.jsdelivr.net/npm/wikiparser-node
	 * ESLint defaults to https://fastly.jsdelivr.net/npm/@bhsd/eslint-browserify@10
	 * Stylelint defaults to https://fastly.jsdelivr.net/npm/@bhsd/stylelint-browserify
	 * Luacheck defaults to https://fastly.jsdelivr.net/npm/luacheck-browserify
	 */
	cdn?: string | undefined;

	/** linter options */
	lintConfig?: LiveOption;

	/** Additional Shiki themes */
	themes?: ThemeRegistrationRaw[];
}
declare interface WikitextOptions extends Options {

	/**
	 * Configuration for [WikiParser-Node](https://github.com/bhsd-harry/wikiparser-node).
	 * Please set this to `true` if used in a MediaWiki site.
	 */
	parserConfig?: ConfigData | string | boolean | undefined;

	/** i18n language codes with a preferred order */
	langs?: string | string[] | undefined;
}

const themeSet = new Set<ThemeRegistrationRaw>();
const getThemes = (themes: ThemeRegistrationRaw[]): ThemeRegistrationRaw[] => {
	for (const theme of themes) {
		themeSet.add(theme);
	}
	return [...themeSet];
};

/**
 * Register the language service for Wikitext
 * @param monaco Monaco Editor global
 * @param opt Options
 * @param opt.parserConfig Configuration for [WikiParser-Node](https://github.com/bhsd-harry/wikiparser-node).
 * Please set this to `true` if used in a MediaWiki site.
 * @param opt.langs i18n language codes with a preferred order
 * @param opt.cdn CDN URL for downloading WikiParser-Node, default to https://fastly.jsdelivr.net/npm/wikiparser-node
 * @param opt.themes Additional Shiki themes
 * @param opt.lintConfig WikiLint options.
 */
export default async (
	monaco: typeof Monaco,
	{parserConfig, langs, cdn, themes = [], lintConfig}: WikitextOptions = {},
): Promise<void> => {
	// 加载 WikiParser-Node
	const loaded = typeof wikiparse === 'object' && isGlobal('wikiparse');
	const getConfig: ConfigGetter = async () => {
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
	await getWikiparse({getConfig, langs, cdn});

	const wikiConfig = await wikiparse.getConfig();
	// 注册语言
	monaco.languages.register({id: 'wikitext', aliases: ['Wikitext', 'mediawiki', 'MediaWiki', 'wiki']});
	monaco.languages.register({id: 'javascript', aliases: ['JavaScript', 'js']});
	monaco.languages.register({id: 'css', aliases: ['CSS']});
	monaco.languages.register({id: 'html', aliases: ['HTML', 'htm', 'xhtml']});
	monaco.languages.register({id: 'json', aliases: ['JSON']});
	shikiToMonaco(await getHighlighter(wikitext, wikiConfig, getThemes(themes)), monaco);

	// 语言设置
	const config = {
		...langConfig,
		autoClosingPairs: [...langConfig.autoClosingPairs],
		brackets: [...langConfig.brackets],
	} as unknown as languages.LanguageConfiguration;
	config.autoClosingPairs!.push(
		...[wikiConfig.ext, wikiConfig.html.slice(0, 2)].flat(2)
			.map((tag): languages.IAutoClosingPairConditional => ({open: `<${tag}>`, close: `</${tag}>`})),
	);
	if (wikiConfig.variants.length === 0) {
		config.brackets = config.brackets!.filter(([op]) => op !== '-{');
		config.autoClosingPairs = config.autoClosingPairs!.filter(({open: op}) => op !== '-{');
	}
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
	monaco.languages.registerCodeActionProvider('wikitext', codeActionProviderForWiki);
	addKeybindings(monaco);
	registerLinterBase(monaco);
	registerWikiLint(cdn, lintConfig);
	monaco.editor.onWillDisposeModel(m => {
		if (m.getLanguageId() === 'wikitext') {
			void getLSP(m)?.destroy();
		}
	});
};

/**
 * Register ESLint for JavaScript
 * @param monaco Monaco Editor global
 * @param opt Options
 * @param opt.cdn CDN URL for downloading ESLint,
 * default to https://fastly.jsdelivr.net/npm/@bhsd/eslint-browserify@10
 * @param opt.lintConfig ESLint options
 */
export const registerJavaScript = (monaco: typeof Monaco, {cdn, lintConfig: lintOpt}: Options = {}): void => {
	monaco.languages.registerCodeActionProvider('javascript', codeActionProvider);
	registerLinterBase(monaco);
	registerESLint(cdn, lintOpt);
};

/**
 * Register Stylelint for CSS
 * @param monaco Monaco Editor global
 * @param opt Options
 * @param opt.cdn CDN URL for downloading Stylelint,
 * default to https://fastly.jsdelivr.net/npm/@bhsd/stylelint-browserify
 * @param opt.lintConfig Stylelint options
 */
export const registerCSS = (monaco: typeof Monaco, {cdn, lintConfig}: Options = {}): void => {
	monaco.languages.registerCodeActionProvider('css', codeActionProvider);
	registerLinterBase(monaco);
	registerStylelint(cdn, lintConfig);
};

/**
 * Register the Luacheck for Lua
 * @param monaco Monaco Editor global
 * @param opt Options
 * @param opt.cdn CDN URL for downloading Luacheck,
 * default to https://fastly.jsdelivr.net/npm/luacheck-browserify
 * @param opt.lintConfig Luacheck options
 */
export const registerLua = (monaco: typeof Monaco, {cdn, lintConfig}: Options = {}): void => {
	registerLinterBase(monaco);
	registerLuacheck(cdn, lintConfig);
};

/**
 * Register the Vue syntax
 * @param monaco Monaco Editor global
 * @param opt Options
 * @param opt.themes Additional Shiki themes
 */
export const registerVue = async (monaco: typeof Monaco, {themes = []}: Options = {}): Promise<void> => {
	monaco.languages.register({id: 'vue', aliases: ['Vue']});
	shikiToMonaco(await getVueHighlighter(getThemes(themes)), monaco);
};
