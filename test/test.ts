import util from '@bhsd/common/dist/test';
// @ts-expect-error JSON module
import results from '../../parserTests.json' with {type: 'json'};
import parse, {getGrammar} from './parser.js';
import type {Grammar} from 'shiki/core';

let grammar: Grammar;
util.mochaTest(
	results,
	wikitext => parse(wikitext, grammar),
	async () => {
		grammar = await getGrammar();
	},
);
