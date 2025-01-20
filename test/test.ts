/* eslint-disable @typescript-eslint/no-require-imports */
import * as fs from 'fs';
import * as assert from 'assert';
// @ts-expect-error JSON module
import defaultConfig from 'wikiparser-node/config/default.json' with {type: 'json'};
// @ts-expect-error JSON module
import parserTests from 'wikiparser-node/test/parserTests.json' with {type: 'json'};
// @ts-expect-error JSON module
import testResults from '../../parserTests.json' with {type: 'json'};
import getHighlighter from '../src/token.js';
import lang from '../src/wikitext.tmLanguage.js';
import type {Grammar} from 'shiki/core';
import type {StateStack} from '@shikijs/vscode-textmate';
import type {Config} from 'wikiparser-node';

declare interface Test {
	desc: string;
	wikitext?: string;
	parsed?: string;
	html?: string;
	print?: string;
	render?: string;
}
declare type TestResult = Pick<Test, 'desc' | 'wikitext' | 'parsed'>;

// eslint-disable-next-line es-x/no-regexp-lookbehind-assertions
const split = (test?: TestResult): string[] | undefined => test?.parsed?.split(/(?<=<\/>)(?!$)|(?<!^)(?=<\w)/u);

const tests: Test[] = parserTests,
	results: TestResult[] = testResults;
const entities = {'<': '&lt;', '>': '&gt', '&': '&amp;'};
let grammar: Grammar;
describe('Parser tests', () => {
	for (let i = tests.length - 1; i >= 0; i--) {
		const test = tests[i]!,
			{wikitext, desc} = test;
		if (wikitext) {
			it(desc, () => { // eslint-disable-line @typescript-eslint/no-loop-func
				try {
					delete test.html;
					delete test.print;
					delete test.render;
					let stack: StateStack | null = null,
						last: string[] = [];
					test.parsed = wikitext.split('\n').map(line => {
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
								+ scopes.slice(j).map(s => `<${s.replace('.wikitext', '')}>`).join('')
								+ part.replace(/[<>&]/gu, m => entities[m as '<' | '>' | '&']);
						}).join('');
					}).join(String.raw`\n`) + '</>'.repeat(last.length);
					assert.deepStrictEqual(split(test), split(results.find(({desc: d}) => d === desc)));
				} catch (e) {
					if (!(e instanceof assert.AssertionError)) {
						tests.splice(i, 1);
					}
					if (e instanceof Error) {
						Object.assign(e, {cause: {message: `\n${wikitext}`}});
					}
					throw e;
				}
			});
		}
	}
	before(async () => {
		grammar = (await getHighlighter(lang, defaultConfig as Config)).getLanguage('wikitext');
	});
	after(() => {
		fs.writeFileSync('test/parserTests.json', `${JSON.stringify(tests, null, '\t')}\n`);
	});
});
