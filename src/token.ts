import {createHighlighterCore} from 'shiki/core';
import {createOnigurumaEngine} from 'shiki/engine/oniguruma';
import javascript from 'shiki/langs/javascript.mjs';
import css from 'shiki/langs/css.mjs';
import htm from 'shiki/langs/html.mjs';
import json from 'shiki/langs/json.mjs';
import loadWasm from 'shiki/wasm';
import type {ConfigData} from 'wikiparser-node';
import type {HighlighterCore, ThemeRegistrationRaw, LanguageRegistration} from 'shiki/core';
import type {IRawRule} from './wikitext.tmLanguage.ts';

const defineGrammar = (rule: IRawRule, options: string[], key: 'match' | 'begin' = 'match'): void => {
	for (let i = 1; i < 10; i++) {
		if ((rule[key] as string).includes(`$${i}`)) {
			Object.assign(rule, {
				[key]: (rule[key] as string).replace(`$${i}`, options.join('|')),
			});
			break;
		}
	}
};

export default async (
	wikitext: LanguageRegistration,
	parserConfig: ConfigData,
	themes: ThemeRegistrationRaw[] = [],
): Promise<HighlighterCore> => {
	const {repository} = wikitext,
		magicWords = repository['magic-words']!.repository!,
		variables = magicWords['variables']!.patterns!,
		parserFunctions = magicWords['parser-function']!.patterns!,
		behaviorSwitches = repository['behavior-switches']!.patterns!,
		link = repository['wiki-link']!.repository!,
		plainLink = link['internal-link']!,
		fileLink = link['file-link']!,
		{
			doubleUnderscore,
			redirection,
			parserFunction,
			functionHook,
			variable,
			nsid,
			protocol,
			ext,
			img,
			variants,
		} = parserConfig,
		namespaces = Object.keys(nsid).filter(Boolean).map(ns => ns.replace(/ /gu, '[_ ]')),
		[p0, p1, ...p2] = parserFunction,
		isOldSchema = Array.isArray(p1),
		isLatestSchema = !isOldSchema && 'functionHook' in parserConfig,
		insensitive = Object.keys(p0).filter(s => !s.startsWith('#')),
		sensitive = (isOldSchema ? p1 : Object.keys(p1)).filter(s => !s.startsWith('#')),
		imgKeys = Object.keys(img),
		protocols = [protocol.replace(/\//gu, String.raw`\/`), String.raw`\/\/`];
	for (let i = 0; i < 2; i++) {
		if (doubleUnderscore.length > i + 2 && doubleUnderscore[i]!.length === 0) {
			doubleUnderscore[i] = Object.keys(doubleUnderscore[i + 2]!);
		}
	}
	defineGrammar(repository['redirect']!, redirection);
	defineGrammar(repository['redirect']!, namespaces);
	defineGrammar(repository['wikixml']!.repository!['wiki-self-closed-tags']!, ext);
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	defineGrammar(variables[0]!, variable ? insensitive.filter(s => variable.includes(p0[s]!)) : insensitive);
	defineGrammar(
		variables[1]!,
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		variable && !isOldSchema ? sensitive.filter(s => variable.includes(p1[s]!)) : sensitive,
	);
	defineGrammar(
		parserFunctions[0]!,
		[
			isLatestSchema ? insensitive.filter(s => functionHook.includes(p0[s]!)) : insensitive,
			p2,
		].flat(2),
		'begin',
	);
	defineGrammar(
		parserFunctions[1]!,
		isLatestSchema ? sensitive.filter(s => functionHook.includes(p1[s]!)) : sensitive,
		'begin',
	);
	defineGrammar(repository['template']!, namespaces, 'begin');
	defineGrammar(behaviorSwitches[0]!, doubleUnderscore[0]);
	defineGrammar(behaviorSwitches[1]!, doubleUnderscore[1]);
	defineGrammar(
		fileLink,
		Object.entries(nsid).filter(([, v]) => v === 6)
			.map(([k]) => k.replace(/ /gu, '[_ ]')),
		'begin',
	);
	defineGrammar(fileLink.patterns![0]!, imgKeys.filter(s => !s.includes('$1')));
	defineGrammar(
		fileLink.patterns![0]!,
		imgKeys.filter(s => s.endsWith('$1')).map(s => s.slice(0, -2)),
	);
	defineGrammar(
		fileLink.patterns![1]!,
		imgKeys.filter(s => s.startsWith('$1')).map(s => s.slice(2)),
	);
	defineGrammar(plainLink, protocols, 'begin');
	defineGrammar(plainLink, namespaces, 'begin');
	defineGrammar(repository['external-link']!, protocols);
	defineGrammar(repository['convert']!.patterns![0]!, variants);
	return createHighlighterCore({
		langs: [
			wikitext,
			javascript,
			css,
			htm,
			json,
		],
		themes,
		engine: createOnigurumaEngine(loadWasm),
	});
};
