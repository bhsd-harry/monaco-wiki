import {CDN as baseCDN} from '@bhsd/browser';
import monokai from 'shiki/themes/monokai.mjs';
import nord from 'shiki/themes/nord.mjs';
import registerWiki, {registerJavaScript, registerCSS, registerLua, registerVue} from './main.ts';
import {getCmObject} from './linter.ts';
import type * as Monaco from 'monaco-editor';
import type {} from 'types-mediawiki';

declare interface RequireConfig {
	paths: Record<string, string>;
	'vs/nls'?: {
		availableLanguages: Record<string, string>;
	};
}
declare interface Require {
	config(config: RequireConfig): void;

	(modules: string[], ready: () => unknown): void;
}

declare const monaco: typeof Monaco & {CDN?: string};

const style = document.createElement('style');
style.textContent =
	'.monaco-editor .glyph-margin-widgets>.codicon-warning::before{color:var(--vscode-problemsWarningIcon-foreground)}'
	+ '.monaco-editor .glyph-margin-widgets>.codicon-error::before{color:var(--vscode-problemsErrorIcon-foreground)}'
	+ '.monaco-hover-content code{color:inherit}';
document.head.append(style);

const i18n = ['de', 'es', 'fr', 'it', 'ja', 'ko', 'ru', 'zh-cn', 'zh-tw'];
const load = async (cdn = baseCDN): Promise<typeof Monaco> => {
	const vs = `${cdn}/npm/monaco-editor/min/vs`;
	await new Promise(resolve => {
		const script = document.createElement('script');
		script.src = `${vs}/loader.js`;
		script.addEventListener('load', resolve);
		document.head.append(script);
	});
	const requirejs = globalThis.require as unknown as Require,
		config: RequireConfig = {paths: {vs}},
		isMW = typeof mw === 'object';
	let langs: string[] | undefined;
	if (isMW) {
		await mw.loader.using('mediawiki.language');
		langs = mw.language.getFallbackLanguageChain();
		config['vs/nls'] = {
			availableLanguages: {
				'*': langs.find(l => i18n.includes(l)) ?? 'en',
			},
		};
	}
	requirejs.config(config);
	return new Promise(resolve => {
		requirejs(['vs/editor/editor.main'], async () => {
			await registerWiki(
				monaco,
				isMW,
				langs,
				cdn,
				[monokai, nord],
				() => ({
					...getCmObject('wikilint'),
					css: getCmObject('Stylelint'),
				}),
			);
			registerJavaScript(monaco, `${cdn}/npm/@bhsd/eslint-browserify`, () => getCmObject('ESLint'));
			registerCSS(monaco, `${cdn}/npm/@bhsd/stylelint-browserify`, () => getCmObject('Stylelint'));
			registerLua(monaco, `${cdn}/npm/luacheck-browserify`);
			await registerVue(monaco, [monokai, nord]);
			resolve(monaco);
		});
	});
};
Object.assign(globalThis, {monaco: load(typeof monaco === 'object' ? monaco.CDN : undefined)});
