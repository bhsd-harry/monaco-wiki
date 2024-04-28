import 'types-mediawiki';
import type * as Monaco from 'monaco-editor';
import type register from '../src/main.ts';

declare global {
	const monaco: typeof Monaco;

	module 'https://testingcf.jsdelivr.net/npm/monaco-wiki*' {
		const registerWiki: typeof register;
		export default registerWiki;
	}
}
