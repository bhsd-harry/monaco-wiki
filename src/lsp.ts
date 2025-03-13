import {getLSP} from '@bhsd/common';
import type * as Monaco from 'monaco-editor';
import type {editor, languages, IRange, IPosition} from 'monaco-editor';
import type {
	ColorInformation,
	TextEdit,
	Range as NRange,
	Position as NPosition,
	MarkupContent,
} from 'vscode-languageserver-types';

const iPositionToNPosition = ({lineNumber, column}: IPosition): NPosition => ({
	line: lineNumber - 1,
	character: column - 1,
});

const nPositionToIPosition = ({line, character}: NPosition): IPosition => ({
	lineNumber: line + 1,
	column: character + 1,
});

const provideReferences = async (
	model: editor.ITextModel,
	pos: IPosition,
	method: 'provideReferences' | 'provideDefinition',
): Promise<languages.Location[] | undefined> =>
	(await getLSP(model)?.[method](model.getValue(), iPositionToNPosition(pos)))
		?.map(({range}): languages.Location => ({
			range: nRangeToIRange(range),
			uri: model.uri,
		}));

export const nRangeToIRange = ({start, end}: NRange): IRange => ({
	startLineNumber: start.line + 1,
	startColumn: start.character + 1,
	endLineNumber: end.line + 1,
	endColumn: end.character + 1,
});

export const documentColorProvider: languages.DocumentColorProvider = {
	async provideDocumentColors(model): Promise<languages.IColorInformation[] | undefined> {
		return (await getLSP(model)?.provideDocumentColors(model.getValue()))
			?.map(({color, range}): languages.IColorInformation => ({
				color,
				range: nRangeToIRange(range),
			}));
	},
	async provideColorPresentations(model, color): Promise<languages.IColorPresentation[] | undefined> {
		return (await getLSP(model)?.provideColorPresentations(color as unknown as ColorInformation))
			?.map(({label, textEdit}): languages.IColorPresentation => ({
				label,
				textEdit: {
					text: textEdit!.newText,
					range: textEdit!.range as unknown as IRange,
				},
			}));
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
				suggestions: items.map(({label, kind, textEdit, documentation}): languages.CompletionItem => ({
					label,
					kind: monaco.languages.CompletionItemKind[kind as keyof typeof monaco.languages.CompletionItemKind],
					insertText: textEdit!.newText,
					range: nRangeToIRange((textEdit as TextEdit).range),
					...documentation && {
						documentation: {
							value: (documentation as MarkupContent).value,
						},
					},
				})),
			};
		},
	};
};

export const foldingRangeProvider: languages.FoldingRangeProvider = {
	async provideFoldingRanges(model): Promise<languages.FoldingRange[] | undefined> {
		return (await getLSP(model)?.provideFoldingRanges(model.getValue()))
			?.map(({startLine, endLine}): languages.FoldingRange => ({
				start: startLine + 1,
				end: endLine + 1,
			}));
	},
};

export const linkProvider: languages.LinkProvider = {
	async provideLinks(model): Promise<languages.ILinksList | undefined> {
		const items = await getLSP(model)?.provideLinks(model.getValue());
		return items && {
			links: items.map(({target, range}): languages.ILink => ({
				url: target!,
				range: nRangeToIRange(range),
			})),
		};
	},
};

export const referenceProvider: languages.ReferenceProvider = {
	provideReferences(model, pos): Promise<languages.Location[] | undefined> {
		return provideReferences(model, pos, 'provideReferences');
	},
};

export const documentHighlightProvider: languages.DocumentHighlightProvider = {
	async provideDocumentHighlights(model, pos): Promise<languages.DocumentHighlight[] | undefined> {
		return (await getLSP(model)?.provideReferences(model.getValue(), iPositionToNPosition(pos)))
			?.map(({range}): languages.DocumentHighlight => ({range: nRangeToIRange(range)}));
	},
};

export const definitionProvider: languages.DefinitionProvider = {
	provideDefinition(model, pos): Promise<languages.Location[] | undefined> {
		return provideReferences(model, pos, 'provideDefinition');
	},
};

export const renameProvider: languages.RenameProvider = {
	async provideRenameEdits(model, pos, newName): Promise<languages.WorkspaceEdit | undefined> {
		const res = await getLSP(model)?.provideRenameEdits(model.getValue(), iPositionToNPosition(pos), newName),
			versionId = model.getVersionId();
		return res && {
			edits: res.changes!['']!.map(({range, newText}): languages.IWorkspaceTextEdit => ({
				resource: model.uri,
				versionId,
				textEdit: {
					range: nRangeToIRange(range),
					text: newText,
				},
			})),
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

export const signatureHelpProvider: languages.SignatureHelpProvider = {
	signatureHelpTriggerCharacters: [':', '：', '|'],
	signatureHelpRetriggerCharacters: ['|'],

	async provideSignatureHelp(model, pos): Promise<languages.SignatureHelpResult | undefined> {
		const res = await getLSP(model)?.provideSignatureHelp(model.getValue(), iPositionToNPosition(pos));
		return res && {
			value: {
				...res as Omit<languages.SignatureHelp, 'activeSignature'>,
				activeSignature: 0,
			},
			dispose(): void {
				//
			},
		};
	},
};

export const inlayHintsProvider: languages.InlayHintsProvider = {
	async provideInlayHints(model): Promise<languages.InlayHintList | undefined> {
		const res = await getLSP(model)?.provideInlayHints(model.getValue());
		return res && {
			hints: res.map(({label, position}): languages.InlayHint => ({
				label: label as string,
				position: nPositionToIPosition(position),
			})),
			dispose(): void {
				//
			},
		};
	},
};
