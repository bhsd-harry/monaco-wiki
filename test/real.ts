import test from '@bhsd/common/dist/test';
import parse, {getGrammar} from './parser.js';

(async () => {
	const grammar = await getGrammar();
	await test.execute(content => parse(content, grammar));
})();
