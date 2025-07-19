import test from '@bhsd/test-util';
import parse, {getGrammar} from './parser.js';

(async () => {
	const grammar = await getGrammar();
	await test.execute(content => parse(content, grammar));
})();
