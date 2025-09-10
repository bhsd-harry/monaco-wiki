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

declare const monaco: typeof Monaco,
	$VERSION: string;

const CDN = `${baseCDN}/npm`,
	version = $VERSION,
	vs = `${CDN}/monaco-editor@${version}/min/vs`;

const style = document.createElement('style');
style.textContent =
'.monaco-editor .glyph-margin-widgets>.codicon-warning::before{color:var(--vscode-problemsWarningIcon-foreground)}'
+ '.monaco-editor .glyph-margin-widgets>.codicon-error::before{color:var(--vscode-problemsErrorIcon-foreground)}'
+ '.monaco-hover-content code{color:inherit}';
document.head.append(style);

const i18n = ['de', 'es', 'fr', 'it', 'ja', 'ko', 'ru', 'zh-cn', 'zh-tw'];
const load = async (): Promise<typeof Monaco> => {
	await new Promise(resolve => {
		const script = document.createElement('script');
		script.src = `${vs}/loader.js`;
		script.addEventListener('load', resolve);
		document.head.append(script);
	});
	const requirejs = globalThis.require as unknown as Require,
		config: RequireConfig = {paths: {vs}},
		isMW = typeof mw === 'object';
	if (isMW) {
		await mw.loader.using('mediawiki.language');
		config['vs/nls'] = {
			availableLanguages: {
				'*': mw.language.getFallbackLanguageChain().find(l => i18n.includes(l)) ?? 'en',
			},
		};
	}
	requirejs.config(config);
	return new Promise(resolve => {
		requirejs(['vs/editor/editor.main'], async () => {
			Object.assign(monaco, {version});
			await registerWiki(
				monaco,
				isMW,
				isMW ? mw.language.getFallbackLanguageChain() : undefined,
				undefined,
				[monokai, nord],
				() => ({
					...getCmObject('wikilint'),
					css: getCmObject('Stylelint'),
				}),
			);
			registerJavaScript(monaco, undefined, () => getCmObject('ESLint'));
			registerCSS(monaco, undefined, () => getCmObject('Stylelint'));
			registerLua(monaco);
			await registerVue(monaco, [monokai, nord]);
			resolve(monaco);
		});
	});
};
Object.assign(globalThis, {monaco: load()});
