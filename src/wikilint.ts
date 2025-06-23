import {getObject} from '@bhsd/common';
import {getWikiLinter} from '@bhsd/codemirror-mediawiki/dist/linter.js';
import {nRangeToIRange, toIRange} from './lsp.ts';
import type * as Monaco from 'monaco-editor';
import type {editor, MarkerSeverity, Position, IRange} from 'monaco-editor';
import type {QuickFixData} from 'wikiparser-node';

declare interface ILinter {
	/* eslint-disable @typescript-eslint/method-signature-style */
	lint?: (text: string) => editor.IMarkerData[] | Promise<editor.IMarkerData[]>;
	fixer?: (text: string, rule?: string) => string | Promise<string>;
	/* eslint-enable @typescript-eslint/method-signature-style */
}

declare interface ITextModelLinter extends Partial<ILinter> {
	glyphs: string[];
	timer?: NodeJS.Timeout;
	disabled?: boolean;
	diagnostics?: (editor.IMarkerData & {data?: QuickFixData[]})[];
}

export interface IWikitextModel extends editor.ITextModel {
	linter?: ITextModelLinter;
	// eslint-disable-next-line @typescript-eslint/method-signature-style
	lint?: (this: IWikitextModel, on?: boolean) => void;
}

export const linterGetters = new Map<string, (model: editor.ITextModel) => Promise<ILinter>>();

/**
 * 获取CM6存储
 * @param key 键名
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getCmObject = (key: string): any => getObject(`codemirror-mediawiki-${key}`);

export const fromPositions = (start: Position, end = start): IRange => ({
	startLineNumber: start.lineNumber,
	startColumn: start.column,
	endLineNumber: end.lineNumber,
	endColumn: end.column,
});

linterGetters.set('wikitext', async model => {
	const wikiLint = await getWikiLinter(undefined, model);
	return {
		async lint(text): Promise<editor.IMarkerData[]> {
			return (await wikiLint(text, getCmObject('wikilint') as Record<string, unknown> | null)).map(({
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
});

/**
 * 获取代码检查器
 * @param monaco Monaco
 */
export default (monaco: typeof Monaco): void => {
	/**
	 * 更新诊断信息
	 * @param model ITextModel 实例
	 * @param clear 是否清除诊断信息
	 */
	const update = (model: IWikitextModel, clear?: boolean): void => {
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

	/**
	 * 启用或禁用代码检查
	 * @param this ITextModel 实例
	 * @param on 是否启用代码检查
	 */
	function lint(this: IWikitextModel, on = true): void {
		if (this.linter) {
			this.linter.disabled = !on;
			if (this.linter.lint) {
				update(this, !on);
			}
			return;
		} else if (!on) {
			return;
		}
		this.linter = {glyphs: []};
		(async () => {
			const lang = this.getLanguageId();
			if (linterGetters.has(lang)) {
				Object.assign(this.linter!, await linterGetters.get(lang)!(this));
				this.onDidChangeContent(() => {
					update(this);
				});
				update(this);
			}
		})();
	}

	monaco.editor.onDidCreateModel((model: IWikitextModel) => {
		model.lint = lint;
		model.lint((getCmObject('addons') as string[] | null)?.includes('lint'));
	});
};
