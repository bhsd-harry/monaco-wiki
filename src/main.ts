/* eslint-disable @typescript-eslint/no-require-imports */
import {createHighlighterCore} from 'shiki/core';
import {createOnigurumaEngine} from 'shiki/engine/oniguruma';
import javascript from 'shiki/langs/javascript.mjs';
import css from 'shiki/langs/css.mjs';
import htm from 'shiki/langs/html.mjs';
import json from 'shiki/langs/json.mjs';
import loadWasm from 'shiki/wasm';
import monokai from 'shiki/themes/monokai.mjs';
import nord from 'shiki/themes/nord.mjs';
import {shikiToMonaco} from '@shikijs/monaco';
import getLinter from './linter.ts';
import completion from './completion.ts';
import {referenceProvider, highlightProvider, renameProvider} from './reference.ts';
import colorProvider from './color.ts';
import {listen} from './tree.ts';
import foldProvider from './fold.ts';
import wikitext from './wikitext.tmLanguage.ts';
import 'wikiparser-node/extensions/typings.d.ts';
import type {Config} from 'wikiparser-node';
import type * as Monaco from 'monaco-editor';
import type {LanguageInput} from 'shiki/core';
import type {IWikitextModel} from './linter.ts';
import type {IRawRule} from './wikitext.tmLanguage.ts';

const config: Monaco.languages.LanguageConfiguration = require('../vendor/language-configuration.json'),
	defaultConfig: Config = require('wikiparser-node/config/default.json');
const {repository} = wikitext,
	magicWords = repository['magic-words'].repository,
	variables = magicWords.variables.patterns,
	parserFunctions = magicWords['parser-function'].patterns,
	behaviorSwitches = repository['behavior-switches'].patterns,
	fileLink = repository['wiki-link'].repository['file-link'];

const defineGrammar = (rule: IRawRule, options: string[], key: 'match' | 'begin' = 'match'): void => {
	for (let i = 1; i < 10; i++) {
		if (rule[key]!.includes(`$${i}`)) {
			Object.assign(rule, {[key]: rule[key]!.replace(`$${i}`, options.join('|'))});
			break;
		}
	}
};

export default async (monaco: typeof Monaco, parserConfig: Config | boolean = false): Promise<void> => {
	const tempConfig = typeof parserConfig === 'object' ? parserConfig : defaultConfig,
		{
			doubleUnderscore,
			redirection,
			parserFunction,
			variable,
			nsid,
			protocol,
			ext,
			html,
			img,
			variants,
		} = tempConfig,
		namespaces = Object.keys(nsid).filter(Boolean).map(ns => ns.replace(/ /gu, '[_ ]')),
		[p0, p1, ...p2] = parserFunction,
		isOldSchema = Array.isArray(p1),
		insensitive = Object.keys(p0).filter(s => !s.startsWith('#')),
		sensitive = (isOldSchema ? p1 : Object.keys(p1)).filter(s => !s.startsWith('#')),
		imgKeys = Object.keys(img);
	for (let i = 0; i < 2; i++) {
		if (doubleUnderscore.length > i + 2 && doubleUnderscore[i]!.length === 0) {
			doubleUnderscore[i] = Object.keys(doubleUnderscore[i + 2]!);
		}
	}
	defineGrammar(repository.redirect, redirection);
	defineGrammar(repository.redirect, namespaces);
	defineGrammar(repository.wikixml.repository['wiki-self-closed-tags'], ext);
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	defineGrammar(variables[0]!, variable ? insensitive.filter(s => variable.includes(p0[s]!)) : insensitive);
	defineGrammar(
		variables[1]!,
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		variable && !isOldSchema ? sensitive.filter(s => variable.includes(p1[s]!)) : sensitive,
	);
	defineGrammar(parserFunctions[0]!, [insensitive, p2].flat(2), 'begin');
	defineGrammar(parserFunctions[1]!, sensitive, 'begin');
	defineGrammar(repository.template, namespaces, 'begin');
	defineGrammar(behaviorSwitches[0]!, doubleUnderscore[0]);
	defineGrammar(behaviorSwitches[1]!, doubleUnderscore[1]);
	defineGrammar(
		fileLink,
		Object.entries(nsid).filter(([, v]) => v === 6).map(([k]) => k.replace(/ /gu, '[_ ]')),
		'begin',
	);
	defineGrammar(fileLink.patterns[0]!, imgKeys.filter(s => !s.includes('$1')));
	defineGrammar(fileLink.patterns[0]!, imgKeys.filter(s => s.endsWith('$1')).map(s => s.slice(0, -2)));
	defineGrammar(fileLink.patterns[1]!, imgKeys.filter(s => s.startsWith('$1')).map(s => s.slice(2)));
	defineGrammar(repository['wiki-link'].repository['internal-link'], namespaces, 'begin');
	defineGrammar(repository['external-link'], [protocol.replace(/\//gu, String.raw`\/`), String.raw`\/\/`]);
	defineGrammar(repository.convert.patterns[0]!, variants);
	config.autoClosingPairs!.push(
		...[ext, html.slice(0, 2)].flat(2).map(tag => ({open: `<${tag}>`, close: `</${tag}>`})),
	);
	const highlighter = await createHighlighterCore({
		langs: [
			wikitext as unknown as LanguageInput,
			javascript,
			css,
			htm,
			json,
		],
		themes: [
			monokai,
			nord,
		],
		engine: createOnigurumaEngine(loadWasm),
	});
	monaco.languages.register({id: 'wikitext', aliases: ['Wikitext', 'mediawiki', 'MediaWiki', 'wiki']});
	monaco.languages.register({id: 'javascript', aliases: ['JavaScript', 'js']});
	monaco.languages.register({id: 'css', aliases: ['CSS']});
	monaco.languages.register({id: 'html', aliases: ['HTML', 'htm', 'xhtml']});
	monaco.languages.register({id: 'json', aliases: ['JSON']});
	shikiToMonaco(highlighter, monaco);
	monaco.languages.setLanguageConfiguration('wikitext', config);
	monaco.languages.registerCompletionItemProvider('wikitext', completion(monaco));
	monaco.languages.registerReferenceProvider('wikitext', referenceProvider(monaco));
	monaco.languages.registerDocumentHighlightProvider('wikitext', highlightProvider(monaco));
	monaco.languages.registerColorProvider('wikitext', colorProvider(monaco));
	monaco.languages.registerRenameProvider('wikitext', renameProvider(monaco));
	monaco.languages.registerFoldingRangeProvider('wikitext', foldProvider);

	monaco.editor.onDidCreateModel((model: IWikitextModel) => {
		getLinter(monaco, model, parserConfig || defaultConfig);
		listen(model);
	});
};
