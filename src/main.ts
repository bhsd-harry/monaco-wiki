import {createHighlighterCore} from 'shiki/core';
import javascript from 'shiki/langs/javascript.mjs';
import css from 'shiki/langs/css.mjs';
import html from 'shiki/langs/html.mjs';
import loadWasm from 'shiki/wasm';
import monokai from 'shiki/themes/monokai.mjs';
import nord from 'shiki/themes/nord.mjs';
import {shikiToMonaco} from '@shikijs/monaco';
import getLinter from './linter.ts';
import completion from './completion.ts';
import referenceProvider from './reference.ts';
import colorProvider from './color.ts';
import {listen} from './tree.ts';
import wikitext from './wikitext.tmLanguage.ts';
import 'wikiparser-node/extensions/typings.d.ts';
import type {Config} from 'wikiparser-node';
import type * as Monaco from 'monaco-editor';
import type {IWikitextModel} from './linter.ts';
import type {IRawRule} from './wikitext.tmLanguage.ts';

const config: Monaco.languages.LanguageConfiguration = require('../vendor/language-configuration.json'),
	defaultConfig: Config = require('wikiparser-node/config/default.json');
const repository = wikitext.repository['wikitext']!.repository!,
	magicWords = repository['magic-words']!.repository!,
	variables = magicWords['variables']!.patterns!,
	behaviorSwitches = magicWords['behavior-switches']!.patterns!;

const defineGrammar = (rule: IRawRule, options: string[], key: 'match' | 'begin' = 'match'): void => {
	Object.assign(rule, {[key]: rule[key]!.replace('$1', options.join('|'))});
};

const registerWiki = async (monaco: typeof Monaco, parserConfig: Config | boolean = false): Promise<void> => {
	const tempConfig = typeof parserConfig === 'object' ? parserConfig : defaultConfig,
		{doubleUnderscore, redirection, parserFunction, nsid, protocol, ext} = tempConfig;
	if (doubleUnderscore[0].length === 0) {
		doubleUnderscore[0] = Object.keys(doubleUnderscore[2]!);
	}
	defineGrammar(repository['redirect']!, redirection);
	defineGrammar(
		variables[0]!,
		[
			...Object.keys(parserFunction[0]).filter(s => !s.startsWith('#')),
			...(parserFunction.slice(2) as string[][]).flat(),
		],
	);
	defineGrammar(variables[1]!, parserFunction[1].filter(s => !s.startsWith('#')));
	defineGrammar(behaviorSwitches[0]!, doubleUnderscore[0]);
	defineGrammar(behaviorSwitches[1]!, doubleUnderscore[1]);
	defineGrammar(repository['file-link']!, Object.entries(nsid).filter(([, v]) => v === 6).map(([k]) => k), 'begin');
	defineGrammar(repository['external-link']!, [protocol.replace(/\//gu, String.raw`\/`), String.raw`\/\/`]);
	config.autoClosingPairs!.push(
		...[ext, tempConfig.html.slice(0, 2)].flat(2).map(tag => ({open: `<${tag}>`, close: `</${tag}>`})),
	);
	const highlighter = await createHighlighterCore({
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
	monaco.languages.register({id: 'javascript', aliases: ['JavaScript', 'js']});
	monaco.languages.register({id: 'css', aliases: ['CSS']});
	monaco.languages.register({id: 'html', aliases: ['HTML', 'htm', 'xhtml']});
	shikiToMonaco(highlighter, monaco);
	monaco.languages.setLanguageConfiguration('wikitext', config);
	monaco.languages.registerCompletionItemProvider('wikitext', completion(monaco));
	monaco.languages.registerReferenceProvider('wikitext', referenceProvider);
	monaco.languages.registerColorProvider('wikitext', colorProvider(monaco));

	monaco.editor.onDidCreateModel((model: IWikitextModel) => {
		getLinter(monaco, model, parserConfig || defaultConfig);
		listen(model);
	});
};

export default registerWiki;
