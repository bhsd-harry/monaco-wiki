import {getHighlighterCore} from 'shiki/core';
import javascript from 'shiki/langs/javascript.mjs';
import css from 'shiki/langs/css.mjs';
import html from 'shiki/langs/html.mjs';
import json from 'shiki/langs/json.mjs';
import loadWasm from 'shiki/wasm';
import monokai from 'shiki/themes/monokai.mjs';
import nord from 'shiki/themes/nord.mjs';
import {shikiToMonaco} from '@shikijs/monaco';
// @ts-expect-error ESM
import {getMwConfig, getParserConfig} from '@bhsd/codemirror-mediawiki/mw/config';
// @ts-expect-error ESM
import {getObject} from '@bhsd/codemirror-mediawiki/mw/util';
import 'wikiparser-node/extensions/typings.d.ts';
import type {Config} from 'wikiparser-node';
import type * as Monaco from 'monaco-editor';

declare interface ITextModelLinter {
	lint(text: string): Promise<Monaco.editor.IMarkerData[]>;
	glyphs: string[];
	timer?: number;
}
declare interface IWikitextModel extends Monaco.editor.ITextModel {
	linter?: ITextModelLinter;
}

const wikitext = require('../vendor/wikitext.tmLanguage.json'),
	config: Monaco.languages.LanguageConfiguration = require('../vendor/language-configuration.json'),
	storageKey = 'codemirror-mediawiki-addons';

const registerWiki = async (monaco: typeof Monaco, parserConfig: Config | boolean = false): Promise<void> => {
	const highlighter = await getHighlighterCore({
		langs: [
			wikitext,
			javascript,
			css,
			html,
			json,
		],
		themes: [
			monokai,
			nord,
		],
		loadWasm,
	});
	monaco.languages.register({id: 'wikitext', aliases: ['wiki', 'mediawiki']});
	monaco.languages.register({id: 'javascript', aliases: ['JavaScript', 'js']});
	monaco.languages.register({id: 'css', aliases: ['CSS']});
	monaco.languages.register({id: 'html', aliases: ['HTML', 'htm', 'xhtml']});
	monaco.languages.register({id: 'json', aliases: ['JSON']});
	shikiToMonaco(highlighter, monaco);
	monaco.languages.setLanguageConfiguration('wikitext', config);

	/**
	 * 更新诊断信息
	 * @param model 文本模型
	 */
	const update = (model: IWikitextModel): void => {
		const linter = model.linter!;
		clearTimeout(linter.timer);
		linter.timer = window.setTimeout(() => {
			(async () => {
				const diagnostics = await linter.lint(model.getValue());
				monaco.editor.setModelMarkers(model, 'WikiLint', diagnostics);
				linter.glyphs = model.deltaDecorations(
					linter.glyphs,
					diagnostics.map(({startLineNumber, severity}) => ({
						range: new monaco.Range(startLineNumber, 1, startLineNumber, 1),
						options: {
							glyphMarginClassName: `codicon codicon-${
								severity === 8 as Monaco.MarkerSeverity ? 'error' : 'warning'
							}`,
						},
					})),
				);
			})();
		}, 750);
	};

	monaco.editor.onDidCreateModel((model: IWikitextModel) => {
		if (model.getLanguageId() === 'wikitext' && (getObject(storageKey) as string[] | null)?.includes('lint')) {
			(async () => {
				if (!('wikiparse' in window)) {
					const CDN = '//testingcf.jsdelivr.net',
						REPO = 'npm/wikiparser-node@1.7.0-beta.1',
						DIR = 'extensions/dist';
					await new Promise(resolve => {
						const script = document.createElement('script');
						script.src = `${CDN}/combine/${REPO}/${DIR}/base.min.js,${REPO}/${DIR}/lint.min.js`;
						script.addEventListener('load', resolve);
						document.body.append(script);
					});
					if (!parserConfig || typeof parserConfig !== 'object') {
						// eslint-disable-next-line require-atomic-updates, no-param-reassign
						parserConfig = parserConfig
							? getParserConfig(await wikiparse.getConfig(), await getMwConfig())
							: await (await fetch(`${CDN}/${REPO}/config/default.json`)).json();
					}
					wikiparse.setConfig(parserConfig as Config);
				}
				const wikilint = new wikiparse.Linter!(true),
					linter: ITextModelLinter = {
						glyphs: [],
						lint(text) {
							return wikilint.monaco(text);
						},
					};
				model.linter = linter;
				model.onDidChangeContent(() => {
					update(model);
				});
				update(model);
			})();
		}
	});
};

export default registerWiki;
