import {getObject} from '@bhsd/browser';
import {toIRange} from './lsp.ts';
import type * as Monaco from 'monaco-editor';
import type {editor, MarkerSeverity} from 'monaco-editor';
import type {QuickFixData} from 'wikiparser-node';
import type {Option as LinterOption} from '@bhsd/codemirror-mediawiki/dist/linter.js';

export interface ILinter {
	/* eslint-disable @typescript-eslint/method-signature-style */
	lint?: (text: string, opt?: LiveOption) => editor.IMarkerData[] | Promise<editor.IMarkerData[]>;
	fixer?: (text: string, rule?: string) => string | Promise<string>;
	/* eslint-enable @typescript-eslint/method-signature-style */
}

declare interface ITextModelLinter extends Partial<ILinter> {
	glyphs: string[];
	timer?: NodeJS.Timeout;
	disabled?: boolean;
	diagnostics?: (editor.IMarkerData & {data?: QuickFixData[]})[];
	option?: LiveOption;
}

export interface IWikitextModel extends editor.ITextModel {
	linter?: ITextModelLinter;
	// eslint-disable-next-line @typescript-eslint/method-signature-style
	lint?: (this: IWikitextModel, on?: boolean) => Promise<void>;
}

export type LiveOption = LinterOption | ((_?: true) => LinterOption | Promise<LinterOption>);

export const linterGetters = new Map<string, (m: editor.ITextModel) => Promise<ILinter>>();

/**
 * 获取CM6存储
 * @param key 键名
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getCmObject = (key: string): any => getObject(`codemirror-mediawiki-${key}`);

let registered = false;

/**
 * 获取代码检查器
 * @param monaco Monaco
 */
export default (monaco: typeof Monaco): void => {
	if (registered) {
		return;
	}

	/**
	 * 更新诊断信息
	 * @param m ITextModel 实例
	 * @param clear 是否清除诊断信息
	 */
	const update = (m: IWikitextModel, clear?: boolean): void => {
		const linter = m.linter!;
		if (!clear && linter.disabled) {
			return;
		}
		clearTimeout(linter.timer);
		linter.timer = setTimeout(() => {
			if (m.isDisposed()) {
				return;
			}
			(async () => {
				linter.diagnostics = clear ? [] : await linter.lint!(m.getValue(), linter.option);
				monaco.editor.setModelMarkers(m, 'Linter', linter.diagnostics);
				linter.glyphs = m.deltaDecorations(
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
			})();
		}, clear ? 0 : 750);
	};

	/**
	 * 启用或禁用代码检查
	 * @param this ITextModel 实例
	 * @param on 是否启用代码检查
	 */
	async function lint(this: IWikitextModel, on = true): Promise<void> {
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
		const lang = this.getLanguageId();
		if (linterGetters.has(lang)) {
			Object.assign(this.linter, await linterGetters.get(lang)!(this));
			this.onDidChangeContent(() => {
				update(this);
			});
			update(this);
		}
	}

	registered = true;
	monaco.editor.onDidCreateModel((m: IWikitextModel) => {
		m.lint = lint;
		void m.lint((getCmObject('addons') as string[] | null)?.includes('lint'));
	});
};
