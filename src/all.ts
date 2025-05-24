import {CDN as baseCDN} from '@bhsd/common';
import registerWiki from './main.ts';
import {codeActionProvider} from './lsp.ts';
import type * as Monaco from 'monaco-editor';
import type {Environment} from 'monaco-editor';

declare interface Require {
	config(config: {paths?: Record<string, string>}): void;

	(modules: string[], ready: () => unknown): void;
}

declare global {
	const monaco: typeof Monaco;
	const mediaWiki: {
		config: {
			get(key: string): string;
		};
		language?: {
			getFallbackLanguageChain?: () => string[]; // eslint-disable-line @typescript-eslint/method-signature-style
		};
	};
}

const CDN = `${baseCDN}/npm`,
	version = '0.52.2',
	vs = `${CDN}/monaco-editor@${version}/min/vs`;

const style = document.createElement('style');
style.textContent =
'.monaco-editor .glyph-margin-widgets>.codicon-warning::before{color:var(--vscode-problemsWarningIcon-foreground)}'
+ '.monaco-editor .glyph-margin-widgets>.codicon-error::before{color:var(--vscode-problemsErrorIcon-foreground)}'
+ '.monaco-hover-content code{color:inherit}';
document.head.append(style);

const MonacoEnvironment: Environment = {
	getWorker(_, label): Worker {
		const paths: Record<string, string> = {
				css: 'css',
				less: 'css',
				scss: 'css',
				javascript: 'ts',
				typescript: 'ts',
				json: 'json',
				html: 'html',
				handlebars: 'html',
				razor: 'html',
			},
			path = paths[label] ?? 'editor',
			blob = new Blob(
				[`importScripts('${CDN}/@bhsd/monaco-editor-es@${version}/workers/${path}.worker.js')`],
				{type: 'text/javascript'},
			),
			url = URL.createObjectURL(blob),
			worker = new Worker(url); // same-origin policy
		URL.revokeObjectURL(url);
		return worker;
	},
};
Object.assign(globalThis, {MonacoEnvironment});

const load = async (): Promise<typeof Monaco> => {
	await new Promise(resolve => {
		const script = document.createElement('script');
		script.src = `${vs}/loader.js`;
		script.addEventListener('load', resolve);
		document.head.append(script);
	});
	const requirejs = globalThis.require as unknown as Require;
	requirejs.config({paths: {vs}});
	return new Promise(resolve => {
		requirejs(['vs/editor/editor.main'], async () => {
			Object.assign(monaco, {version});
			monaco.languages.registerCodeActionProvider('css', codeActionProvider);
			monaco.languages.registerCodeActionProvider('javascript', codeActionProvider);
			const isMW = typeof mediaWiki === 'object';
			await registerWiki(
				monaco,
				isMW,
				isMW
					? mediaWiki.language?.getFallbackLanguageChain?.() ?? [mediaWiki.config.get('wgUserLanguage')]
					: undefined,
			);
			resolve(monaco);
		});
	});
};
Object.assign(globalThis, {monaco: load()});
