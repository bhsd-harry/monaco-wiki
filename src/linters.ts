import {jsConfig, getJsLinter, getCssLinter, getLuaLinter} from '@bhsd/codemirror-mediawiki/dist/linter.js';
import {iRangeToNRange, toIRange} from './lsp.ts';
import {getCmObject, fromPositions} from './wikilint.ts';
import type {editor, Position} from 'monaco-editor';
import type {Linter, Rule, AST} from 'eslint';
import type {QuickFixData} from 'wikiparser-node';
import type {linterGetters} from './wikilint.ts';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const toNRange = (model: editor.ITextModel, range: AST.Range) => iRangeToNRange(
	fromPositions(...range.map(x => model.getPositionAt(x)) as [Position, Position]),
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

export default (getters: typeof linterGetters): void => {
	getters.set('javascript', async model => {
		const esLint = await getJsLinter();
		return {
			lint(text): editor.IMarkerData[] {
				return esLint(text, {
					...jsConfig,
					...getCmObject('ESLint') as Record<string, unknown> | null,
				}).map(({
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

	getters.set('css', async model => {
		const styleLint = await getCssLinter();
		return {
			async lint(code): Promise<editor.IMarkerData[]> {
				return (await styleLint(
					code,
					(getCmObject('Stylelint') ?? {rules: {}}) as Record<string, unknown>,
				)).map(({
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

	getters.set('lua', async () => {
		const luaLint = await getLuaLinter();
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
