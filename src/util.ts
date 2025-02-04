import type {Range as NRange, Position as NPosition} from 'vscode-languageserver-types';
import type {IRange, IPosition, editor} from 'monaco-editor';
import type {LanguageServiceBase} from 'wikiparser-node/extensions/typings.d.ts';

const lsps = new WeakMap<editor.ITextModel, LanguageServiceBase>();

export const iPositionToNPosition = ({lineNumber, column}: IPosition): NPosition => ({
	line: lineNumber - 1,
	character: column - 1,
});

export const nRangeToIRange = ({start, end}: NRange): IRange => ({
	startLineNumber: start.line + 1,
	startColumn: start.character + 1,
	endLineNumber: end.line + 1,
	endColumn: end.character + 1,
});

export const getLSP = (model: editor.ITextModel): LanguageServiceBase | undefined => {
	if (!('wikiparse' in globalThis && wikiparse.LanguageService) || lsps.has(model)) {
		return lsps.get(model);
	}
	const lsp = new wikiparse.LanguageService();
	lsps.set(model, lsp);
	return lsp;
};
