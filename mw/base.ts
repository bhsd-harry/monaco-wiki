import * as monaco from 'https://testingcf.jsdelivr.net/npm/monaco-editor/+esm';
import registerWiki from 'https://testingcf.jsdelivr.net/npm/monaco-wiki/dist/main.min.js';
import type * as Monaco from 'monaco-editor';

const CDN = '//testingcf.jsdelivr.net/npm',
	langMap: Record<string, string> = {
		'sanitized-css': 'css',
		js: 'javascript',
		scribunto: 'lua',
		mediawiki: 'wikitext',
	};

void registerWiki(monaco, true);
mw.loader.load(`${CDN}/monaco-editor/esm/vs/base/browser/ui/codicons/codicon/codicon.min.css`, 'text/css');

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
	 * @see https://github.com/inpageedit/Plugins/blob/master/src/plugins/monaco/script.js
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
			multiCursorModifier: 'ctrlCmd',
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
		mw.hook('wiki-monaco').fire(this);
	}

	/**
	 * 将 textarea 替换为 Monaco
	 * @param textarea textarea 元素
	 * @param lang 语言
	 */
	static async fromTextArea(textarea: HTMLTextAreaElement, lang?: string): Promise<MonacoWikiEditor> {
		if (!lang) {
			/* eslint-disable no-param-reassign */
			const {wgAction, wgNamespaceNumber, wgPageContentModel} = mw.config.get();
			if (wgAction === 'edit' || wgAction === 'submit') {
				lang = wgNamespaceNumber === 274 ? 'html' : wgPageContentModel.toLowerCase();
			} else {
				await mw.loader.using('oojs-ui-windows');
				lang = (await OO.ui.prompt('Please indicate the content model:') || undefined)?.toLowerCase();
			}
			if (lang && lang in langMap) {
				lang = langMap[lang];
			}
			/* eslint-enable no-param-reassign */
		}
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

document.body.addEventListener('click', e => {
	if (e.target instanceof HTMLTextAreaElement && e.shiftKey) {
		e.preventDefault();
		void MonacoWikiEditor.fromTextArea(e.target);
	}
});

Object.assign(window, {MonacoWikiEditor});

export type {MonacoWikiEditor};