import testUtil from '@bhsd/test-util';
import parse, {getGrammar} from './parser.js';

(async () => {
	const grammar = await getGrammar();
	await testUtil.execute(content => parse(content, grammar));
})();
