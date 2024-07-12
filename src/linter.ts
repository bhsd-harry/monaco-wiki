// @ts-expect-error ESM
import {getMwConfig, getParserConfig} from '@bhsd/codemirror-mediawiki/mw/config';
// @ts-expect-error ESM
import {getObject} from '@bhsd/codemirror-mediawiki/mw/util';
// @ts-expect-error ESM
import {CDN} from '@bhsd/codemirror-mediawiki/src/util';
import {
	getWikiLinter,
	getJsLinter,
	getCssLinter,
	getLuaLinter,
	// @ts-expect-error ESM
} from '@bhsd/codemirror-mediawiki/src/linter';
// @ts-expect-error not module
import type {} from 'requirejs';
import type * as Monaco from 'monaco-editor';
import type {Config} from 'wikiparser-node';
import type {LinterBase} from 'wikiparser-node/extensions/typings.d.ts';
import type {Linter} from 'eslint';
import type {Warning} from 'stylelint';
import type {Diagnostic} from '@codemirror/lint';

declare interface ITextModelLinter {
	// eslint-disable-next-line @typescript-eslint/method-signature-style
	lint?: (text: string) => Monaco.editor.IMarkerData[] | Promise<Monaco.editor.IMarkerData[]>;
	glyphs: string[];
	timer?: number;
	disabled?: boolean;
}

export interface IWikitextModel extends Monaco.editor.ITextModel {
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
 * @param parserConfig 解析器配置
 */
const getLinter = (monaco: typeof Monaco, model: IWikitextModel, parserConfig: Config | boolean): void => {
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
		linter.timer = window.setTimeout(() => {
			(async () => {
				const diagnostics = clear ? [] : await linter.lint!(model.getValue());
				monaco.editor.setModelMarkers(model, 'Linter', diagnostics);
				linter.glyphs = model.deltaDecorations(
					linter.glyphs,
					diagnostics.map(({startLineNumber, severity, message}) => ({
						range: new monaco.Range(startLineNumber, 1, startLineNumber, 1),
						options: {
							glyphMarginClassName: `codicon codicon-${
								severity === 8 as Monaco.MarkerSeverity ? 'error' : 'warning'
							}`,
							glyphMarginHoverMessage: {value: message},
						},
					})),
				);
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
					const loaded = 'wikiparse' in window,
						config: Record<string, string> | null = getCmObject('wikilint'),
						wikilint: LinterBase = await getWikiLinter({include: true});
					if (!loaded) {
						if (typeof parserConfig !== 'object') {
							// eslint-disable-next-line require-atomic-updates, no-param-reassign
							parserConfig = parserConfig
								? getParserConfig(await wikiparse.getConfig(), await getMwConfig())
								: await (await fetch(`${CDN}/npm/wikiparser-node@browser/config/default.json`))
									.json();
						}
						wikiparse.setConfig(parserConfig as Config);
					}
					linter.lint = async (text): Promise<Monaco.editor.IMarkerData[]> =>
						((await wikilint.monaco(text)) as (Monaco.editor.IMarkerData & {rule: string})[])
							.filter(({rule, severity}) => Number(config?.[rule] || 1) > Number(severity as number < 8));
					break;
				}
				case 'javascript': {
					const opt = {
							env: {browser: true, es2024: true, jquery: true},
							globals: {mw: 'readonly', mediaWiki: 'readonly', OO: 'readonly'},
							...getCmObject('ESLint'),
						} as Linter.Config as Record<string, unknown>,
						esLint: (text: string) => Linter.LintMessage[] = await getJsLinter(opt);
					linter.lint = (text): Monaco.editor.IMarkerData[] =>
						esLint(text).map(({ruleId, message, severity, line, column, endLine, endColumn}) => ({
							source: `ESLint(${ruleId})`,
							startLineNumber: line,
							startColumn: column,
							endLineNumber: endLine ?? line,
							endColumn: endColumn ?? column,
							severity: severity === 2 ? 8 : 4,
							message,
						}));
					break;
				}
				case 'css': {
					const opt: Record<string, unknown> | null = getCmObject('Stylelint'),
						styleLint: (code: string) => Promise<Warning[]> = await getCssLinter(opt);
					linter.lint = async (code): Promise<Monaco.editor.IMarkerData[]> =>
						(await styleLint(code)).map(({text, severity, line, column, endLine, endColumn}) => ({
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
					const luaLint: (text: string) => Diagnostic[] = await getLuaLinter();
					linter.lint = (text): Monaco.editor.IMarkerData[] => luaLint(text)
						.map(({source, from, message}) => {
							const {lineNumber, column} = this.getPositionAt(from);
							return {
								source: source!,
								startLineNumber: lineNumber,
								startColumn: column,
								endLineNumber: lineNumber,
								endColumn: column,
								severity: 8,
								message,
							};
						});
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

export default getLinter;
