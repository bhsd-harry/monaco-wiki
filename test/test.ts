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
import parse from './parser.js';
import type {Grammar} from 'shiki/core';
import type {ConfigData} from 'wikiparser-node';

declare interface Test {
	desc: string;
	wikitext?: string;
	parsed?: string;
	html?: string;
	print?: string;
	render?: string;
}
declare type TestResult = Pick<Test, 'desc' | 'wikitext' | 'parsed'>;

const split = (test?: TestResult): string[] | undefined =>
	// eslint-disable-next-line es-x/no-regexp-lookbehind-assertions
	test?.parsed?.split(/(?<=<\/>)(?!$)|(?<!^)(?=<\w)/u);

const tests: Test[] = parserTests,
	results: TestResult[] = testResults;
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
					test.parsed = parse(wikitext, grammar);
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
		grammar = (await getHighlighter(lang, defaultConfig as ConfigData)).getLanguage('wikitext');
	});
	after(() => {
		fs.writeFileSync('test/parserTests.json', `${JSON.stringify(tests, null, '\t')}\n`);
	});
});
