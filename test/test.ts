import {mochaTest} from '@bhsd/test-util';
// @ts-expect-error directory change during build
import results from '../../parserTests.json' with {type: 'json'};
import parse, {getGrammar} from './parser.js';
import type {Grammar} from 'shiki/core';

let grammar: Grammar;
mochaTest(
	results,
	wikitext => parse(wikitext, grammar),
	async () => {
		grammar = await getGrammar();
	},
);
