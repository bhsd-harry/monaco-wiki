import {getLSP, iPositionToNPosition, nRangeToIRange} from './util.ts';
import type * as Monaco from 'monaco-editor';
import type {languages} from 'monaco-editor';
import type {TextEdit} from 'vscode-languageserver-types';

export default (monaco: typeof Monaco): languages.CompletionItemProvider => {
	monaco.editor.addKeybindingRule({
		keybinding: monaco.KeyMod.Shift | monaco.KeyCode.Enter, // eslint-disable-line no-bitwise
		command: 'editor.action.triggerSuggest',
	});

	return {
		triggerCharacters: ['#'],

		async provideCompletionItems(model, pos): Promise<languages.CompletionList | undefined | null> {
			const items = await getLSP(model)?.provideCompletionItems(model.getValue(), iPositionToNPosition(pos));
			return items && {
				suggestions: items.map(({label, kind, textEdit}) => ({
					label,
					kind: monaco.languages
						.CompletionItemKind[kind as unknown as keyof typeof languages.CompletionItemKind],
					insertText: textEdit!.newText,
					range: nRangeToIRange((textEdit as TextEdit).range),
				}) satisfies languages.CompletionItem),
			};
		},
	};
};
