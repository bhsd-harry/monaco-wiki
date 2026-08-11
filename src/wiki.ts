/* eslint-disable unicorn/no-top-level-side-effects */
import {CDN as baseCDN, isGlobal} from '@bhsd/browser';
import light from 'shiki/themes/light-plus.mjs';
import monokai from 'shiki/themes/monokai.mjs';
import registerWiki, {registerJavaScript, registerCSS, registerLua} from './main.js';
import {getCmObject} from './linter.js';
import type * as Monaco from 'monaco-editor';
import type {} from 'types-mediawiki';

declare interface RequireConfig {
	paths: Record<string, string>;
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

const load = async (cdn = baseCDN): Promise<typeof Monaco> => {
	const vs = `${cdn}/npm/monaco-editor@0.55.1/min/vs`;
	await new Promise(resolve => {
		const script = document.createElement('script');
		script.src = `${vs}/loader.js`;
		script.addEventListener('load', resolve);
		document.head.append(script);
	});
	const requirejs = globalThis.require as unknown as Require,
		config: RequireConfig = {paths: {vs}},
		isMW = typeof mediaWiki === 'object' && isGlobal('mediaWiki');
	let langs: string[] | undefined;
	if (isMW) {
		await mw.loader.using('mediawiki.language');
		langs = mw.language.getFallbackLanguageChain();
	}
	requirejs.config(config);
	return new Promise(resolve => {
		requirejs(['vs/editor/editor.main'], async () => {
			await registerWiki(
				monaco,
				{
					parserConfig: isMW,
					langs,
					cdn,
					themes: [light, monokai],
					lintConfig: () => ({
						...getCmObject('wikilint'),
						css: getCmObject('Stylelint'),
					}),
				},
			);
			registerJavaScript(monaco, {
				cdn: `${cdn}/npm/@bhsd/eslint-browserify@10`,
				lintConfig: () => getCmObject('ESLint'),
			});
			registerCSS(monaco, {
				cdn: `${cdn}/npm/@bhsd/stylelint-browserify`,
				lintConfig: () => getCmObject('Stylelint'),
			});
			registerLua(monaco, {
				cdn: `${cdn}/npm/luacheck-browserify`,
				lintConfig: () => getCmObject('Luacheck'),
			});
			resolve(monaco);
		});
	});
};
export default load(typeof monaco === 'object' && isGlobal('monaco') ? monaco.CDN : undefined);
