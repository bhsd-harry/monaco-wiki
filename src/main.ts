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
import 'wikiparser-node/extensions/typings.d.ts';
import type {Config} from 'wikiparser-node';
import type * as Monaco from 'monaco-editor';

const wikitext = require('../vendor/wikitext.tmLanguage.json'),
	config: Monaco.languages.LanguageConfiguration = require('../vendor/language-configuration.json');

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

	monaco.editor.onDidCreateModel(model => {
		if (model.getLanguageId() === 'wikitext') {
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
				const linter = new wikiparse.Linter!(true);
				let timer: number;
				model.onDidChangeContent(() => {
					clearTimeout(timer);
					timer = window.setTimeout(() => {
						(async () => {
							monaco.editor.setModelMarkers(model, 'WikiLint', await linter.monaco(model.getValue()));
						})();
					}, 750);
				});
			})();
		}
	});
};

export default registerWiki;
