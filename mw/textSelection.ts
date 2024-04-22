import type {MonacoWikiEditor} from './base.ts';

export const instances = new WeakMap<HTMLTextAreaElement, MonacoWikiEditor>();

/**
 * 获取Monaco Editor实例
 * @param $ele textarea元素的jQuery对象
 */
const getInstance = ($ele: JQuery<HTMLTextAreaElement>): MonacoWikiEditor => instances.get($ele[0]!)!;

declare interface EncapsulateOptions {
	pre?: string;
	peri?: string;
	post?: string;
	ownline?: boolean;
	replace?: boolean;
	selectPeri?: boolean;
	splitlines?: boolean;
	selectionStart?: number;
	selectionEnd?: number;
}

/**
 * jQuery.textSelection overrides for Monaco Editor.
 * See jQuery.textSelection.js for method documentation
 */
export const textSelection = {
	getContents(this: JQuery<HTMLTextAreaElement>): string {
		return getInstance(this).model.getValue();
	},
	setContents(this: JQuery<HTMLTextAreaElement>, content: string): JQuery<HTMLTextAreaElement> {
		getInstance(this).model.setValue(content);
		return this;
	},
	getSelection(this: JQuery<HTMLTextAreaElement>): string {
		const {model, editor} = getInstance(this);
		return model.getValueInRange(editor.getSelection()!);
	},
	setSelection(
		this: JQuery<HTMLTextAreaElement>,
		{start, end = start}: {start: number, end?: number},
	): JQuery<HTMLTextAreaElement> {
		const {model, editor} = getInstance(this),
			{lineNumber: startLineNumber, column: startColumn} = model.getPositionAt(start),
			{lineNumber: endLineNumber, column: endColumn} = model.getPositionAt(end);
		editor.setSelection({startLineNumber, startColumn, endLineNumber, endColumn});
		return this;
	},
	replaceSelection(this: JQuery<HTMLTextAreaElement>, value: string): JQuery<HTMLTextAreaElement> {
		const {editor} = getInstance(this);
		editor.executeEdits('replaceSelection', [{range: editor.getSelection()!, text: value, forceMoveMarkers: true}]);
		return this;
	},
	encapsulateSelection(this: JQuery<HTMLTextAreaElement>, {
		pre = '',
		peri = '',
		post = '',
		ownline,
		replace,
		splitlines,
		selectionStart,
		selectionEnd = selectionStart,
	}: EncapsulateOptions): JQuery<HTMLTextAreaElement> {
		if (selectionStart !== undefined) {
			textSelection.setSelection.call(this, {start: selectionStart, end: selectionEnd!});
		}
		const {model, editor} = getInstance(this),
			selection = editor.getSelection()!,
			selText = replace || selection.isEmpty() ? peri : model.getValueInRange(selection),
			insertText = `${ownline && selection.startColumn > 1 ? '\n' : ''}${splitlines
				? selText.split('\n').map(line => `${pre}${line}${post}`).join('\n')
				: `${pre}${selText}${post}`
			}${ownline && selection.endColumn <= model.getLineLength(selection.endLineNumber) ? '\n' : ''}`;
		editor.executeEdits('encapsulateSelection', [{range: selection, text: insertText, forceMoveMarkers: true}]);
		return this;
	},
	getCaretPosition(this: JQuery<HTMLTextAreaElement>, option?: {startAndEnd?: boolean}): [number, number] | number {
		const {editor, model} = getInstance(this),
			selection = editor.getSelection()!,
			to = model.getOffsetAt(selection.getEndPosition());
		return option?.startAndEnd ? [model.getOffsetAt(selection.getStartPosition()), to] : to;
	},
	scrollToCaretPosition(this: JQuery<HTMLTextAreaElement>): JQuery<HTMLTextAreaElement> {
		const {editor} = getInstance(this);
		editor.revealPosition(editor.getPosition()!);
		return this;
	},
};
