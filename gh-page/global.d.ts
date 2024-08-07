import type {editor} from 'monaco-editor';
import type * as ParserBase from 'wikiparser-node';
import 'wikiparser-node/extensions/typings';

declare global {
	module '/monaco-wiki/*' {}

	const monaco: PromiseLike<{editor: typeof editor}>;
	const Parser: typeof ParserBase;

	type Config = ParserBase.Config;
}
