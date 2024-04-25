import type {Linter} from 'eslint';
import type {PublicApi} from 'stylelint';

interface luaparse {
	defaultOptions: {luaVersion: string};
	parse(s: string): void;
	SyntaxError: new () => {message: string, index: number};
}

declare global {
	const eslint: {
		Linter: new () => Linter;
	};
	const stylelint: PublicApi;
	const luaparse: luaparse;

	interface JsonError {
		message: string;
		severity: 'error';
		line: string | undefined;
		column: string | undefined;
		position: string | undefined;
	}
}
