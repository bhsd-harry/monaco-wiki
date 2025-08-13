import {
	getWikiLinter,
	jsConfig,
	getJsLinter,
	getCssLinter,
	getLuaLinter,
} from '@bhsd/codemirror-mediawiki/dist/linter.js';
import {nRangeToIRange, iRangeToNRange, toIRange} from './lsp.ts';
import {linterGetters} from './linter.ts';
import type {editor, Position, IRange} from 'monaco-editor';
import type {Linter, Rule, AST} from 'eslint';
import type {QuickFixData} from 'wikiparser-node';
import type {Option as LinterOption} from '@bhsd/codemirror-mediawiki/dist/linter.js';
import type {LiveOption, ILinter} from './linter.ts';

declare interface ITextModel extends editor.ITextModel {
	getRangeAt(start: number, end: number): IRange;
}

const fromPositions = (start: Position, end = start): IRange => ({
	startLineNumber: start.lineNumber,
	startColumn: start.column,
	endLineNumber: end.lineNumber,
	endColumn: end.column,
});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const toNRange = (model: editor.ITextModel, range: AST.Range) => iRangeToNRange(
	(model as ITextModel).getRangeAt(...range),
);

const getData = (
	model: editor.ITextModel,
	rule: string,
	fix?: Rule.Fix,
	suggestions: Linter.LintSuggestion[] = [],
): QuickFixData[] => [
	...fix
		? [
			{
				title: `Fix this ${rule} problem`,
				fix: true,
				range: toNRange(model, fix.range),
				newText: fix.text,
			},
		]
		: [],
	...suggestions.map(({desc, fix: {range, text}}) => ({
		title: `${desc} (${rule})`,
		fix: false,
		range: toNRange(model, range),
		newText: text,
	})),
];

const getOption = async (opt?: LiveOption): Promise<LinterOption> => typeof opt === 'function' ? opt(true) : opt;

export const registerWikiLint = (opt?: LiveOption): void => {
	linterGetters.set('wikitext', async model => {
		const wikiLint = await getWikiLinter(undefined, model);
		const linter: ILinter = {
			async lint(text, option = opt): Promise<editor.IMarkerData[]> {
				return (await wikiLint(text, await getOption(option))).map(({
					code,
					severity,
					message,
					source,
					range,
					from,
					to,
					data,
				}): editor.IMarkerData & {data?: unknown} => {
					const isStylelint = source === 'Stylelint',
						start = isStylelint ? model.getPositionAt(from!) : undefined,
						end = isStylelint ? model.getPositionAt(to!) : undefined;
					return {
						code: code as string,
						severity: severity === 1 ? 8 : 4,
						message: isStylelint
							? message.slice(0, message.lastIndexOf('(') - 1)
							: message,
						source: source!,
						data,
						...isStylelint ? fromPositions(start!, end) : nRangeToIRange(range!),
					};
				});
			},
		};
		if (wikiLint.fixer) {
			linter.fixer = (text, rule): Promise<string> =>
				wikiLint.fixer!(text, rule) as Promise<string>;
		}
		return linter;
	});
};

export const registerESLint = (cdn?: string, opt?: LiveOption): void => {
	linterGetters.set('javascript', async model => {
		const esLint = await getJsLinter(cdn);
		return {
			async lint(text, option = opt): Promise<editor.IMarkerData[]> {
				return esLint(text, {...jsConfig, ...await getOption(option)}).map(({
					ruleId,
					message,
					severity,
					line,
					column,
					endLine,
					endColumn,
					fix,
					suggestions,
				}): editor.IMarkerData & {data: QuickFixData[] | undefined} => ({
					code: ruleId!,
					source: 'ESLint',
					severity: severity === 2 ? 8 : 4,
					message,
					data: getData(model, ruleId!, fix, suggestions),
					...toIRange(line, column, endLine, endColumn),
				}));
			},
			fixer(text, rule): string {
				return esLint.fixer!(text, rule) as string;
			},
		};
	});
};

export const registerStylelint = (cdn?: string, opt?: LiveOption): void => {
	linterGetters.set('css', async model => {
		const styleLint = await getCssLinter(cdn);
		return {
			async lint(code, option = opt): Promise<editor.IMarkerData[]> {
				return (await styleLint(code, await getOption(option) ?? {rules: {}})).map(({
					text,
					severity,
					line,
					column,
					endLine,
					endColumn,
					rule,
					fix,
				}): editor.IMarkerData & {data: QuickFixData[] | undefined} => ({
					code: rule,
					source: 'Stylelint',
					severity: severity === 'error' ? 8 : 4,
					message: text,
					data: getData(model, rule, fix),
					...toIRange(line, column, endLine, endColumn),
				}));
			},
			fixer(text, rule): Promise<string> {
				return styleLint.fixer!(text, rule) as Promise<string>;
			},
		};
	});
};

export const registerLuacheck = (cdn?: string): void => {
	linterGetters.set('lua', async () => {
		const luaLint = await getLuaLinter(cdn);
		return {
			async lint(text): Promise<editor.IMarkerData[]> {
				return (await luaLint(text))
					.map(({line, column, end_column: endColumn, msg, severity}): editor.IMarkerData => ({
						source: 'Luacheck',
						severity: severity * 4,
						message: msg,
						...toIRange(line, column, line, endColumn + 1),
					}));
			},
		};
	});
};
