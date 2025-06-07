// @ts-expect-error JSON module
import defaultConfig from 'wikiparser-node/config/default.json' with {type: 'json'};
import getHighlighter from '../src/token.js';
import lang from '../src/wikitext.tmLanguage.js';
import type {ConfigData} from 'wikiparser-node';
import type {Grammar} from 'shiki/core';
import type {StateStack} from '@shikijs/vscode-textmate';

const entities = {'<': '&lt;', '>': '&gt', '&': '&amp;'};

export const getGrammar = async (): Promise<Grammar> =>
	(await getHighlighter(lang, defaultConfig as ConfigData)).getLanguage('wikitext');

export default (wikitext: string, grammar: Grammar): string => {
	let stack: StateStack | null = null,
		last: string[] = [];

	return wikitext.split('\n').map(line => {
		const {tokens, ruleStack} = grammar.tokenizeLine(line, stack);
		stack = ruleStack;
		return tokens.map(({startIndex, endIndex, scopes}) => {
			const part = line.slice(startIndex, endIndex);
			if (!part) {
				return '';
			}
			scopes.shift();
			const l = last.length;
			let j = 0;
			for (; j < l && j < scopes.length && last[j] === scopes[j]; j++) {
				// pass
			}
			last = scopes;
			return '</>'.repeat(l - j)
				+ scopes.slice(j).map(s => `<${s.replace('.wikitext', '')}>`)
					.join('')
					+ part.replace(/[<>&]/gu, m => entities[m as '<' | '>' | '&']);
		}).join('');
	}).join(String.raw`\n`) + '</>'.repeat(last.length);
};
