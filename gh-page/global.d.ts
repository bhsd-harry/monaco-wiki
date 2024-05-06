import type {editor} from 'monaco-editor';

declare global {
	module '/monaco-wiki/*' {}

	const monaco: {editor: typeof editor};

	interface Window {
		monaco: Promise<unknown>;
	}
}
