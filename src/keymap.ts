import {keybindings, encapsulateLines} from '@bhsd/codemirror-mediawiki/dist/keybindings.mjs';
import type * as Monaco from 'monaco-editor';
import type {KeyCode} from 'monaco-editor';

declare type Key = keyof typeof KeyCode;

const keyCodeMap: Record<string, Key> = {'.': 'Period', ',': 'Comma', '/': 'Slash'};

export default (monaco: typeof Monaco): void => {
	for (const {desc, key, pre = '', post = '', splitlines} of keybindings) {
		const keys = key.split('-'),
			main = keys[keys.length - 1]!,
			id = `encapsulate.wikitext.${desc}`;
		let keyCode: Key;
		if (Number.isInteger(Number(main))) {
			keyCode = `Digit${main}` as 'Digit0';
		} else if (/[a-z]/u.test(main)) {
			keyCode = `Key${main.toUpperCase()}` as 'KeyA';
		} else {
			keyCode = keyCodeMap[main]!;
		}
		monaco.editor.addEditorAction({
			id,
			label: desc,
			precondition: 'editorLangId == wikitext',
			keybindings: [
				/* eslint-disable no-bitwise */
				(keys.includes('Ctrl') ? monaco.KeyMod.WinCtrl : 0)
				| (keys.includes('Mod') ? monaco.KeyMod.CtrlCmd : 0)
				| (keys.includes('Shift') ? monaco.KeyMod.Shift : 0)
				| monaco.KeyCode[keyCode],
				/* eslint-enable no-bitwise */
			],
			run(editor) {
				const model = editor.getModel()!;
				if (splitlines) {
					editor.setSelections(
						editor.getSelections()!.map(range => ({
							selectionStartLineNumber: range.startLineNumber,
							selectionStartColumn: 1,
							positionLineNumber: range.endLineNumber,
							positionColumn: model.getLineMaxColumn(range.endLineNumber),
						})),
					);
				}
				editor.executeEdits(
					id,
					editor.getSelections()!.map(range => {
						const value = model.getValueInRange(range);
						return {
							range,
							text: splitlines ? encapsulateLines(value, pre, post) : pre + value + post,
						};
					}),
				);
			},
		});
	}
};
