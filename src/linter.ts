import {getObject} from '@bhsd/common';
import {
	getJsLinter,
	getCssLinter,
	getLuaLinter,
// @ts-expect-error ESM
} from '@bhsd/codemirror-mediawiki/dist/linter.mjs';
import {getLSP, nRangeToIRange} from './lsp.ts';
import type * as Monaco from 'monaco-editor';
import type {editor, MarkerSeverity, Position} from 'monaco-editor';
import type {Linter} from 'eslint';
import type {Warning} from 'stylelint';
import type {Diagnostic} from 'luacheck-browserify';

declare interface ITextModelLinter {
	// eslint-disable-next-line @typescript-eslint/method-signature-style
	lint?: (text: string) => editor.IMarkerData[] | Promise<editor.IMarkerData[]>;
	glyphs: string[];
	timer?: NodeJS.Timeout;
	disabled?: boolean;
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
					const diagnostics = clear ? [] : await linter.lint!(model.getValue());
					monaco.editor.setModelMarkers(model, 'Linter', diagnostics);
					linter.glyphs = model.deltaDecorations(
						linter.glyphs,
						diagnostics.map(({startLineNumber, severity, message}): editor.IModelDeltaDecoration => ({
							range: new monaco.Range(startLineNumber, 1, startLineNumber, 1),
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

	/**
	 * 计算位置
	 * @param offset 额外偏移量
	 * @param maxOffset 最大偏移量
	 * @param lines 各行文本
	 * @param line 行号
	 * @param column 列号
	 */
	const positionAt = (offset: number, maxOffset: number, lines: string[], line: number, column: number): Position => {
		let index: number;
		if (line === 1) {
			index = 0;
		} else if (line === lines.length + 2) {
			index = maxOffset;
		} else {
			index = lines.slice(0, line - 2).join('\n').length + column - 1;
		}
		return model.getPositionAt(offset + index);
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
					const config: Record<string, string> | null = getCmObject('wikilint');
					linter.lint = async (text): Promise<editor.IMarkerData[]> => {
						const lsp = getLSP(model),
							diagnostics = (await lsp?.provideDiagnostics(text))?.filter(
								({code, severity}) => Number(config?.[code!] ?? 1) > Number(severity as number > 1),
							).map(({code, severity, message, source, range}): editor.IMarkerData => ({
								code: code as string,
								severity: severity === 1 ? 8 : 4,
								message,
								source: source!,
								...nRangeToIRange(range),
							})) ?? [];
						if (!lsp?.findStyleTokens || config?.['invalid-css'] === '0') {
							return diagnostics;
						}
						const styleLint: ((code: string) => Promise<Warning[]>) = await getCssLinter();
						return [
							diagnostics,
							await Promise.all((await lsp.findStyleTokens()).map(async ({childNodes, type, tag}) => {
								const {range: [offset], data} = childNodes![1]!.childNodes![0]!,
									l = data!.length,
									lines = data!.split('\n');
								return (await styleLint(
									`${type === 'ext-attr' ? 'div' : tag as string}{\n${data}\n}`,
								)).map(({
									line,
									column,
									endLine,
									endColumn,
									rule,
									severity,
									text: msg,
								}): editor.IMarkerData => {
									const start = positionAt(offset, l, lines, line, column),
										end = endLine === undefined
											? start
											: positionAt(offset, l, lines, endLine, endColumn!);
									return {
										code: rule,
										severity: severity === 'error' ? 8 : 4,
										message: msg.slice(0, msg.lastIndexOf('(') - 1),
										source: 'Stylelint',
										startLineNumber: start.lineNumber,
										startColumn: start.column,
										endLineNumber: end.lineNumber,
										endColumn: end.column,
									};
								});
							})),
						].flat(2);
					};
					break;
				}
				case 'javascript': {
					const opt = {
							env: {browser: true, es2024: true, jquery: true},
							globals: {mw: 'readonly', mediaWiki: 'readonly', OO: 'readonly'},
							...getCmObject('ESLint'),
						} as Linter.Config as Record<string, unknown>,
						esLint: (text: string) => Linter.LintMessage[] = await getJsLinter(opt);
					linter.lint = (text): editor.IMarkerData[] =>
						esLint(text).map(
							({ruleId, message, severity, line, column, endLine, endColumn}): editor.IMarkerData => ({
								source: `ESLint(${ruleId})`,
								startLineNumber: line,
								startColumn: column,
								endLineNumber: endLine ?? line,
								endColumn: endColumn ?? column,
								severity: severity === 2 ? 8 : 4,
								message,
							}),
						);
					break;
				}
				case 'css': {
					const opt: Record<string, unknown> | null = getCmObject('Stylelint'),
						styleLint: (code: string) => Promise<Warning[]> = await getCssLinter(opt);
					linter.lint = async (code): Promise<editor.IMarkerData[]> =>
						(await styleLint(code))
							.map(({text, severity, line, column, endLine, endColumn}): editor.IMarkerData => ({
								source: 'Stylelint',
								startLineNumber: line,
								startColumn: column,
								endLineNumber: endLine ?? line,
								endColumn: endColumn ?? column,
								severity: severity === 'error' ? 8 : 4,
								message: text,
							}));
					break;
				}
				case 'lua': {
					const luaLint: (text: string) => Promise<Diagnostic[]> = await getLuaLinter();
					linter.lint = async (text): Promise<editor.IMarkerData[]> =>
						(await luaLint(text))
							.map(({line, column, end_column: endColumn, msg, severity}): editor.IMarkerData => ({
								source: 'Luacheck',
								startLineNumber: line,
								startColumn: column,
								endLineNumber: line,
								endColumn: endColumn + 1,
								severity: severity * 4,
								message: msg,
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
