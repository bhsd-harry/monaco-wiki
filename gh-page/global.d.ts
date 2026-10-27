import type {editor} from 'monaco-editor';
import type {} from 'wikiparser-node/dist/extensions/typings';

declare global {
	const monaco: PromiseLike<{editor: typeof editor}>;
}
