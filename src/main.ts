import {getHighlighterCore} from 'shiki/core';
import javascript from 'shiki/langs/javascript.mjs';
import css from 'shiki/langs/css.mjs';
import html from 'shiki/langs/html.mjs';
import loadWasm from 'shiki/wasm';
import monokai from 'shiki/themes/monokai.mjs';
import nord from 'shiki/themes/nord.mjs';
import {shikiToMonaco} from '@shikijs/monaco';
import 'wikiparser-node/extensions/typings.d.ts';
import type * as Monaco from 'monaco-editor';

const wikitext = require('../vendor/wikitext.tmLanguage.json'),
	config: Monaco.languages.LanguageConfiguration = require('../vendor/language-configuration.json');

const registerWiki = async (monaco: typeof Monaco): Promise<void> => {
	const highlighter = await getHighlighterCore({
		langs: [
			wikitext,
			javascript,
			css,
			html,
		],
		themes: [
			monokai,
			nord,
		],
		loadWasm,
	});
	monaco.languages.register({id: 'wikitext', aliases: ['wiki', 'mediawiki']});
	shikiToMonaco(highlighter, monaco);
	monaco.languages.setLanguageConfiguration('wikitext', config);

	monaco.editor.onDidCreateModel(model => {
		if (model.getLanguageId() === 'wikitext') {
			(async () => {
				if (!('wikiparse' in window)) {
					await new Promise(resolve => {
						const script = document.createElement('script');
						script.src = '//testingcf.jsdelivr.net/combine/'
						+ 'npm/wikiparser-node@1.7.0-beta.1/extensions/dist/base.min.js,'
						+ 'npm/wikiparser-node@1.7.0-beta.1/extensions/dist/lint.min.js';
						script.addEventListener('load', resolve);
						document.body.append(script);
					});
				}
				const linter = new wikiparse.Linter!();
				let timer: NodeJS.Timeout;
				model.onDidChangeContent(() => {
					clearTimeout(timer);
					timer = setTimeout(() => {
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
