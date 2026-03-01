import testUtil from '@bhsd/test-util';
// @ts-expect-error JSON module
import results from '../../parserTests.json' with {type: 'json'};
import parse, {getGrammar} from './parser.js';
import type {Grammar} from 'shiki/core';

let grammar: Grammar;
testUtil.mochaTest(
	results,
	wikitext => parse(wikitext, grammar),
	async () => {
		grammar = await getGrammar();
	},
);
