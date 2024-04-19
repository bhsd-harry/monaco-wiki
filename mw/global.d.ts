import 'types-mediawiki';
import * as Monaco from 'monaco-editor';
import type register from '../src/main.ts';

declare global {
	module 'https://testingcf.jsdelivr.net/npm/monaco-editor/*' {
		export = Monaco;
	}

	module 'https://testingcf.jsdelivr.net/npm/monaco-wiki*' {
		const registerWiki: typeof register;
		export default registerWiki;
	}
}
