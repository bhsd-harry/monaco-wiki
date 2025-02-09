import type * as Monaco from 'monaco-editor';
import type {editor, languages, IRange, IPosition} from 'monaco-editor';
import type {
	ColorInformation,
	TextEdit,
	Range as NRange,
	Position as NPosition,
	MarkupContent,
} from 'vscode-languageserver-types';
import type {LanguageServiceBase} from 'wikiparser-node/extensions/typings.d.ts';

const lsps = new WeakMap<editor.ITextModel, LanguageServiceBase>();

const iPositionToNPosition = ({lineNumber, column}: IPosition): NPosition => ({
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

export const documentColorProvider: languages.DocumentColorProvider = {
	async provideDocumentColors(model): Promise<languages.IColorInformation[] | undefined> {
		return (await getLSP(model)?.provideDocumentColors(model.getValue()))?.map(({color, range}) => ({
			color,
			range: nRangeToIRange(range),
		}) satisfies languages.IColorInformation);
	},
	async provideColorPresentations(model, color): Promise<languages.IColorPresentation[] | undefined> {
		return (await getLSP(model)?.provideColorPresentations(color as unknown as ColorInformation))
			?.map(({label, textEdit}) => ({
				label,
				textEdit: {
					text: textEdit!.newText,
					range: textEdit!.range as unknown as IRange,
				},
			}) satisfies languages.IColorPresentation);
	},
};

export const completionItemProvider = (monaco: typeof Monaco): languages.CompletionItemProvider => {
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
					kind: monaco.languages.CompletionItemKind[kind],
					insertText: textEdit!.newText,
					range: nRangeToIRange((textEdit as TextEdit).range),
				}) satisfies languages.CompletionItem),
			};
		},
	};
};

export const foldingRangeProvider: languages.FoldingRangeProvider = {
	async provideFoldingRanges(model): Promise<languages.FoldingRange[] | undefined> {
		return (await getLSP(model)?.provideFoldingRanges(model.getValue()))?.map(({startLine, endLine}) => ({
			start: startLine + 1,
			end: endLine + 1,
		}) satisfies languages.FoldingRange);
	},
};

export const linkProvider: languages.LinkProvider = {
	async provideLinks(model): Promise<languages.ILinksList | undefined> {
		const items = await getLSP(model)?.provideLinks(model.getValue());
		return items && {
			links: items.map(({target, range}) => ({
				url: target!,
				range: nRangeToIRange(range),
			}) satisfies languages.ILink),
		};
	},
};

export const referenceProvider: languages.ReferenceProvider = {
	async provideReferences(model, pos): Promise<languages.Location[] | undefined> {
		return (await getLSP(model)?.provideReferences(model.getValue(), iPositionToNPosition(pos)))
			?.map(({range}) => ({
				range: nRangeToIRange(range),
				uri: model.uri,
			}) satisfies languages.Location);
	},
};

export const documentHighlightProvider: languages.DocumentHighlightProvider = {
	async provideDocumentHighlights(model, pos): Promise<languages.DocumentHighlight[] | undefined> {
		return (await getLSP(model)?.provideReferences(model.getValue(), iPositionToNPosition(pos)))
			?.map(({range}) => ({range: nRangeToIRange(range)}) satisfies languages.DocumentHighlight);
	},
};

export const definitionProvider: languages.DefinitionProvider = {
	async provideDefinition(model, pos): Promise<languages.Location[] | undefined> {
		return (await getLSP(model)?.provideDefinition(model.getValue(), iPositionToNPosition(pos)))
			?.map(({range}) => ({
				range: nRangeToIRange(range),
				uri: model.uri,
			}) satisfies languages.Location);
	},
};

export const renameProvider: languages.RenameProvider = {
	async provideRenameEdits(model, pos, newName): Promise<languages.WorkspaceEdit | undefined> {
		const res = await getLSP(model)?.provideRenameEdits(model.getValue(), iPositionToNPosition(pos), newName),
			versionId = model.getVersionId();
		return res && {
			edits: res.changes!['']!.map(({range, newText}) => ({
				resource: model.uri,
				versionId,
				textEdit: {
					range: nRangeToIRange(range),
					text: newText,
				},
			}) satisfies languages.IWorkspaceTextEdit),
		};
	},
	async resolveRenameLocation(model, pos): Promise<languages.RenameLocation & languages.Rejection> {
		const res = await getLSP(model)?.resolveRenameLocation(model.getValue(), iPositionToNPosition(pos));
		if (res) {
			const range = nRangeToIRange(res);
			return {
				range,
				text: model.getValueInRange(range),
			};
		}
		return {
			range: {startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1},
			text: '',
			rejectReason: 'You cannot rename this element.',
		};
	},
};

export const hoverProvider: languages.HoverProvider = {
	async provideHover(model, pos): Promise<languages.Hover | undefined> {
		const res = await getLSP(model)?.provideHover(model.getValue(), iPositionToNPosition(pos));
		return res && {
			range: nRangeToIRange(res.range!),
			contents: [res.contents as MarkupContent],
		};
	},
};
