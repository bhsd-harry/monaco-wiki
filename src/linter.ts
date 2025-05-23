import {getObject} from '@bhsd/common';
import {getWikiLinter, getJsLinter, getCssLinter, getLuaLinter} from '@bhsd/codemirror-mediawiki/dist/linter.mjs';
import {nRangeToIRange, iRangeToNRange, toIRange} from './lsp.ts';
import type * as Monaco from 'monaco-editor';
import type {editor, MarkerSeverity, Position} from 'monaco-editor';
import type {Linter, Rule, AST} from 'eslint';
import type {QuickFixData} from 'wikiparser-node';

declare interface ITextModelLinter {
	/* eslint-disable @typescript-eslint/method-signature-style */
	lint?: (text: string) => editor.IMarkerData[] | Promise<editor.IMarkerData[]>;
	glyphs: string[];
	timer?: NodeJS.Timeout;
	disabled?: boolean;
	diagnostics?: (editor.IMarkerData & {data?: QuickFixData[]})[];
	fixer?: (text: string, rule?: string) => string | Promise<string>;
	/* eslint-enable @typescript-eslint/method-signature-style */
}

export interface IWikitextModel extends editor.ITextModel {
	linter?: ITextModelLinter;
	// eslint-disable-next-line @typescript-eslint/method-signature-style
	lint?: (this: IWikitextModel, on?: boolean) => void;
}

/**
 * 获取CM6存储
 * @param key 键名
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getCmObject = (key: string): any => getObject(`codemirror-mediawiki-${key}`);

/**
 * 获取代码检查器
 * @param monaco Monaco
 * @param model 文本模型
 */
export default (monaco: typeof Monaco, model: IWikitextModel): void => {
	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	const toNRange = (range: AST.Range) => iRangeToNRange(monaco.Range.fromPositions(
		...range.map(x => model.getPositionAt(x)) as [Position, Position],
	));

	const getData = (rule: string, fix?: Rule.Fix, suggestions: Linter.LintSuggestion[] = []): QuickFixData[] => [
		...fix
			? [
				{
					title: `Fix this ${rule} problem`,
					fix: true,
					range: toNRange(fix.range),
					newText: fix.text,
				},
			]
			: [],
		...suggestions.map(({desc, fix: {range, text}}) => ({
			title: `${desc} (${rule})`,
			fix: false,
			range: toNRange(range),
			newText: text,
		})),
	];

	/**
	 * 更新诊断信息
	 * @param clear 是否清除诊断信息
	 */
	const update = (clear?: boolean): void => {
		const linter = model.linter!;
		if (!clear && linter.disabled) {
			return;
		}
		clearTimeout(linter.timer);
		linter.timer = setTimeout(() => {
			(async () => {
				if (!model.isDisposed()) {
					linter.diagnostics = clear ? [] : await linter.lint!(model.getValue());
					monaco.editor.setModelMarkers(model, 'Linter', linter.diagnostics);
					linter.glyphs = model.deltaDecorations(
						linter.glyphs,
						linter.diagnostics
							.map(({startLineNumber, severity, message}): editor.IModelDeltaDecoration => ({
								range: toIRange(startLineNumber, 1, startLineNumber, 1),
								options: {
									glyphMarginClassName: `codicon codicon-${
										severity === 8 as MarkerSeverity ? 'error' : 'warning'
									}`,
									glyphMarginHoverMessage: {value: message},
								},
							})),
					);
				}
			})();
		}, clear ? 0 : 750);
	};

	model.lint = function(on = true): void {
		if (this.linter) {
			this.linter.disabled = !on;
			if (this.linter.lint) {
				update(!on);
			}
			return;
		} else if (!on) {
			return;
		}
		const linter: ITextModelLinter = {glyphs: []};
		this.linter = linter;
		(async () => {
			switch (this.getLanguageId()) {
				case 'wikitext': {
					const wikiLint = await getWikiLinter(undefined, model);
					linter.lint = async (text): Promise<editor.IMarkerData[]> =>
						(await wikiLint(text, getCmObject('wikilint') as Record<string, unknown> | null)).map(({
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
								...isStylelint
									? monaco.Range.fromPositions(start!, end)
									: nRangeToIRange(range!),
							};
						});
					break;
				}
				case 'javascript': {
					const opt: Linter.Config = {
							env: {browser: true, es2024: true, jquery: true},
							globals: {mw: 'readonly', mediaWiki: 'readonly', OO: 'readonly'},
						},
						esLint = await getJsLinter();
					linter.lint = (text): editor.IMarkerData[] =>
						esLint(text, {...opt, ...getCmObject('ESLint') as Record<string, unknown> | null}).map(({
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
							data: getData(ruleId!, fix, suggestions),
							...toIRange(line, column, endLine, endColumn),
						}));
					linter.fixer = (text, rule): string => esLint.fixer!(text, rule) as string;
					break;
				}
				case 'css': {
					const styleLint = await getCssLinter();
					linter.lint = async (code): Promise<editor.IMarkerData[]> =>
						(await styleLint(
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
							data: getData(rule, fix),
							...toIRange(line, column, endLine, endColumn),
						}));
					linter.fixer = (text, rule): Promise<string> => styleLint.fixer!(text, rule) as Promise<string>;
					break;
				}
				case 'lua': {
					const luaLint = await getLuaLinter();
					linter.lint = async (text): Promise<editor.IMarkerData[]> =>
						(await luaLint(text))
							.map(({line, column, end_column: endColumn, msg, severity}): editor.IMarkerData => ({
								source: 'Luacheck',
								severity: severity * 4,
								message: msg,
								...toIRange(line, column, line, endColumn + 1),
							}));
				}
				// no default
			}
			if (linter.lint) {
				this.onDidChangeContent(() => {
					update();
				});
				update();
			}
		})();
	};

	model.lint((getCmObject('addons') as string[] | null)?.includes('lint'));
};
