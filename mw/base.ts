import registerWiki from 'https://testingcf.jsdelivr.net/npm/monaco-wiki@0.3.1/dist/main.min.js';
// @ts-expect-error ESM
import {wikiEditor} from '@bhsd/codemirror-mediawiki/mw/wikiEditor';
// @ts-expect-error ESM
import {getObject} from '@bhsd/codemirror-mediawiki/mw/util';
import {instances, textSelection} from './textSelection.ts';
import type * as Monaco from 'monaco-editor';

const CDN = 'https://testingcf.jsdelivr.net/npm',
	vs = `${CDN}/monaco-editor/min/vs`,
	langMap: Record<string, string> = {
		'sanitized-css': 'css',
		js: 'javascript',
		gadget: 'javascript',
		scribunto: 'lua',
		mediawiki: 'wikitext',
		template: 'wikitext',
	};

mw.loader.addStyleTag(
	'.monaco-editor .glyph-margin-widgets>.codicon-warning::before{color:var(--vscode-problemsWarningIcon-foreground)}'
	+ '.monaco-editor .glyph-margin-widgets>.codicon-error::before{color:var(--vscode-problemsErrorIcon-foreground)}'
	+ '.monaco-hover-content code{color:inherit}',
);

class MonacoWikiEditor {
	readonly #textarea;
	readonly #model;
	readonly #editor;
	readonly #lang;

	get textarea(): HTMLTextAreaElement {
		return this.#textarea;
	}

	get model(): Monaco.editor.ITextModel {
		return this.#model;
	}

	get editor(): Monaco.editor.IStandaloneCodeEditor {
		return this.#editor;
	}

	get lang(): string {
		return this.#lang;
	}

	/**
	 * @param textarea 文本框
	 * @param lang 语言
	 */
	constructor(textarea: HTMLTextAreaElement, lang = 'plaintext') {
		this.#textarea = textarea;
		this.#lang = lang;
		const model = monaco.editor.createModel(textarea.value, lang),
			container = document.createElement('div'),
			{offsetHeight} = textarea;
		container.style.height = offsetHeight ? `${offsetHeight}px` : textarea.style.height;
		container.style.minHeight = '2em';
		textarea.after(container);
		textarea.style.display = 'none';
		this.#editor = monaco.editor.create(container, {
			model,
			automaticLayout: true,
			theme: 'monokai',
			readOnly: textarea.readOnly,
			wordWrap: lang === 'wikitext' || lang === 'html' || lang === 'plaintext' ? 'on' : 'off',
			wordBreak: 'keepAll',
			glyphMargin: true,
			unicodeHighlight: {
				ambiguousCharacters: lang !== 'wikitext' && lang !== 'html' && lang !== 'plaintext',
			},
		});
		this.#model = model;
		let timer: number;
		model.onDidChangeContent(() => {
			clearTimeout(timer);
			timer = window.setTimeout(() => {
				textarea.value = model.getValue();
			}, 400);
		});
		instances.set(textarea, this);
		if (mw.loader.getState('jquery.textSelection') === 'ready') {
			$(textarea).data('jquery.textSelection', textSelection);
		}
		mw.hook('wiki-monaco').fire(this);
	}

	/**
	 * 将 textarea 替换为 Monaco
	 * @param textarea textarea 元素
	 * @param lang 语言
	 */
	static async fromTextArea(textarea: HTMLTextAreaElement, lang?: string): Promise<MonacoWikiEditor> {
		if ((getObject('codemirror-mediawiki-addons') as string[] | null)?.includes('wikiEditor')) {
			try {
				await wikiEditor($(textarea));
			} catch {}
		}
		/* eslint-disable no-param-reassign */
		if (!lang) {
			const {wgAction, wgNamespaceNumber, wgPageContentModel} = mw.config.get();
			if (wgAction === 'edit' || wgAction === 'submit') {
				lang = wgNamespaceNumber === 274 ? 'html' : wgPageContentModel.toLowerCase();
			} else {
				await mw.loader.using('oojs-ui-windows');
				lang = (await OO.ui.prompt('Please indicate the content model:') || undefined)?.toLowerCase();
			}
		}
		if (lang && lang in langMap) {
			lang = langMap[lang];
		}
		/* eslint-enable no-param-reassign */
		if (
			lang === 'wikitext'
			&& mw.config.get('wgServerName').endsWith('.moegirl.org.cn')
			&& !mw.config.exists('wikilintConfig')
		) {
			mw.config.set(
				'wikilintConfig',
				await (await fetch(`${CDN}/wikiparser-node@browser/config/moegirl.json`)).json(),
			);
		}
		const editor = new MonacoWikiEditor(textarea, lang);
		return editor;
	}
}

Object.assign(window, {MonacoWikiEditor});

window.MonacoEnvironment = {
	getWorker(_, label): Worker {
		const paths: Record<string, string> = {
				css: 'css',
				javascript: 'ts',
				json: 'json',
			},
			path = paths[label] || 'editor',
			blob = new Blob(
				[`importScripts('${CDN}/@bhsd/monaco-editor-es/workers/${path}.worker.js')`],
				{type: 'text/javascript'},
			),
			url = URL.createObjectURL(blob),
			worker = new Worker(url);
		URL.revokeObjectURL(url);
		return worker;
	},
};

(async () => {
	if (typeof define !== 'function' || !('amd' in define)) {
		await $.ajax(`${vs}/loader.js`, {dataType: 'script', cache: true});
	}
	require.config({paths: {vs}});
	require(['vs/editor/editor.main'], () => {
		void registerWiki(monaco, true);

		document.body.addEventListener('click', e => {
			if (e.target instanceof HTMLTextAreaElement && e.shiftKey) {
				e.preventDefault();
				void MonacoWikiEditor.fromTextArea(e.target);
			}
		});
	});
})();

export type {MonacoWikiEditor};
