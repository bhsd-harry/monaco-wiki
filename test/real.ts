import {execute} from '@bhsd/test-util';
import parse, {getGrammar} from './parser.js';

(async () => {
	const grammar = await getGrammar();
	await execute(content => parse(content, grammar));
})();
