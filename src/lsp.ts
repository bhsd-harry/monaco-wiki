import {getLSP} from '@bhsd/browser';
import type * as Monaco from 'monaco-editor';
import type {editor, languages, IRange, IPosition} from 'monaco-editor';
import type {
	ColorInformation,
	TextEdit,
	Range as NRange,
	Position as NPosition,
	MarkupContent,
} from 'vscode-languageserver-types';
import type {IWikitextModel} from './linter.ts';

const iPositionToNPosition = ({lineNumber, column}: IPosition): NPosition => ({
	line: lineNumber - 1,
	character: column - 1,
});

const nPositionToIPosition = ({line, character}: NPosition): IPosition => ({
	lineNumber: line + 1,
	column: character + 1,
});

const provideReferences = async (
	m: editor.ITextModel,
	pos: IPosition,
	method: 'provideReferences' | 'provideDefinition',
): Promise<languages.Location[] | undefined> =>
	(await getLSP(m)?.[method](m.getValue(), iPositionToNPosition(pos)))
		?.map(({range}): languages.Location => ({
			range: nRangeToIRange(range),
			uri: m.uri,
		}));

const deepEqual = (a: editor.IMarkerData, b: editor.IMarkerData): boolean =>
	a.code === b.code && a.severity === b.severity && a.message === b.message && a.source === b.source
	&& a.startLineNumber === b.startLineNumber && a.startColumn === b.startColumn
	&& a.endLineNumber === b.endLineNumber && a.endColumn === b.endColumn;

export const toIRange = (line: number, column: number, endLine?: number, endColumn?: number): IRange => ({
	startLineNumber: line,
	startColumn: column,
	endLineNumber: endLine ?? line,
	endColumn: endColumn ?? column,
});

export const nRangeToIRange = ({start, end}: NRange): IRange => toIRange(
	start.line + 1,
	start.character + 1,
	end.line + 1,
	end.character + 1,
);

export const iRangeToNRange = ({startLineNumber, startColumn, endLineNumber, endColumn}: IRange): NRange => ({
	start: {
		line: startLineNumber - 1,
		character: startColumn - 1,
	},
	end: {
		line: endLineNumber - 1,
		character: endColumn - 1,
	},
});

export const documentColorProvider: languages.DocumentColorProvider = {
	async provideDocumentColors(m): Promise<languages.IColorInformation[] | undefined> {
		return (await getLSP(m)?.provideDocumentColors(m.getValue()))
			?.map(({color, range}): languages.IColorInformation => ({
				color,
				range: nRangeToIRange(range),
			}));
	},
	async provideColorPresentations(m, color): Promise<languages.IColorPresentation[] | undefined> {
		return (await getLSP(m)?.provideColorPresentations(color as unknown as ColorInformation))
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

		async provideCompletionItems(m, pos): Promise<languages.CompletionList | undefined | null> {
			const items = await getLSP(m)?.provideCompletionItems(m.getValue(), iPositionToNPosition(pos));
			return items && {
				suggestions: items.map(({label, kind, textEdit, documentation}): languages.CompletionItem => ({
					label,
					kind: monaco.languages.CompletionItemKind[kind as keyof typeof languages.CompletionItemKind],
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
	async provideFoldingRanges(m): Promise<languages.FoldingRange[] | undefined> {
		return (await getLSP(m)?.provideFoldingRanges(m.getValue()))
			?.map(({startLine, endLine}): languages.FoldingRange => ({
				start: startLine + 1,
				end: endLine + 1,
			}));
	},
};

export const linkProvider: languages.LinkProvider = {
	async provideLinks(m): Promise<languages.ILinksList | undefined> {
		const items = await getLSP(m)?.provideLinks(m.getValue());
		return items && {
			links: items.map(({target, range}): languages.ILink => ({
				url: target!,
				range: nRangeToIRange(range),
			})),
		};
	},
};

export const referenceProvider: languages.ReferenceProvider = {
	provideReferences(m, pos): Promise<languages.Location[] | undefined> {
		return provideReferences(m, pos, 'provideReferences');
	},
};

export const documentHighlightProvider: languages.DocumentHighlightProvider = {
	async provideDocumentHighlights(m, pos): Promise<languages.DocumentHighlight[] | undefined> {
		return (await getLSP(m)?.provideReferences(m.getValue(), iPositionToNPosition(pos)))
			?.map(({range}): languages.DocumentHighlight => ({range: nRangeToIRange(range)}));
	},
};

export const definitionProvider: languages.DefinitionProvider = {
	provideDefinition(m, pos): Promise<languages.Location[] | undefined> {
		return provideReferences(m, pos, 'provideDefinition');
	},
};

export const renameProvider: languages.RenameProvider = {
	async provideRenameEdits(m, pos, newName): Promise<languages.WorkspaceEdit | undefined> {
		const res = await getLSP(m)?.provideRenameEdits(m.getValue(), iPositionToNPosition(pos), newName),
			versionId = m.getVersionId();
		return res && {
			edits: res.changes!['']!.map(({range, newText}): languages.IWorkspaceTextEdit => ({
				resource: m.uri,
				versionId,
				textEdit: {
					range: nRangeToIRange(range),
					text: newText,
				},
			})),
		};
	},
	async resolveRenameLocation(m, pos): Promise<languages.RenameLocation & languages.Rejection> {
		const res = await getLSP(m)?.resolveRenameLocation(m.getValue(), iPositionToNPosition(pos));
		if (res) {
			const range = nRangeToIRange(res);
			return {
				range,
				text: m.getValueInRange(range),
			};
		}
		return {
			range: toIRange(1, 1, 1, 1),
			text: '',
			rejectReason: 'You cannot rename this element.',
		};
	},
};

export const hoverProvider: languages.HoverProvider = {
	async provideHover(m, pos): Promise<languages.Hover | undefined> {
		const res = await getLSP(m)?.provideHover(m.getValue(), iPositionToNPosition(pos));
		return res && {
			range: nRangeToIRange(res.range!),
			contents: [res.contents as MarkupContent],
		};
	},
};

export const signatureHelpProvider: languages.SignatureHelpProvider = {
	signatureHelpTriggerCharacters: [':', '：', '|'],
	signatureHelpRetriggerCharacters: ['|'],

	async provideSignatureHelp(m, pos): Promise<languages.SignatureHelpResult | undefined> {
		const res = await getLSP(m)?.provideSignatureHelp(m.getValue(), iPositionToNPosition(pos));
		return res && {
			value: {
				...res as Omit<languages.SignatureHelp, 'activeSignature'>,
				activeSignature: 0,
			},
			dispose(this: Partial<languages.SignatureHelpResult>): void {
				delete this.value;
			},
		};
	},
};

export const inlayHintsProvider: languages.InlayHintsProvider = {
	async provideInlayHints(m): Promise<languages.InlayHintList | undefined> {
		const res = await getLSP(m)?.provideInlayHints(m.getValue());
		return res && {
			hints: res.map(({label, position}): languages.InlayHint => ({
				label: label as string,
				position: nPositionToIPosition(position),
			})),
			dispose(this: Partial<languages.InlayHintList>): void {
				delete this.hints;
			},
		};
	},
};

const resolveCodeAction = async (
	action: languages.CodeAction & {model: IWikitextModel, rule?: string},
): Promise<languages.CodeAction> => {
	const {title, model: m, rule} = action;
	if (/^Fix all .+ problems$/u.test(title)) {
		action.edit = {
			edits: [
				{
					resource: m.uri,
					versionId: m.getVersionId(),
					textEdit: {
						range: m.getFullModelRange(),
						text: await m.linter!.fixer!(m.getValue(), rule),
					},
				},
			],
		};
	}
	return action;
};

const provideQuickFix = (
	m: IWikitextModel,
	{markers, only}: languages.CodeActionContext,
): languages.CodeAction[] => {
	if (only && !/^quickfix(?:$|\.)/u.test(only)) {
		return [];
	}
	const fixable = m.linter?.diagnostics?.filter(
		diagnostic => diagnostic.data?.length && markers.some(marker => deepEqual(marker, diagnostic)),
	);
	if (!fixable?.length) {
		return [];
	}
	const autofixable = fixable.filter(({source, data}) => source !== 'Stylelint' && data!.some(({fix}) => fix)),
		versionId = m.getVersionId();
	return [
		...fixable.flatMap(
			diagnostic => diagnostic.data!.map(({title, fix, range, newText}): languages.CodeAction => ({
				title,
				isPreferred: fix,
				kind: 'quickfix',
				diagnostics: markers.filter(marker => deepEqual(marker, diagnostic)),
				edit: {
					edits: [
						{
							resource: m.uri,
							versionId,
							textEdit: {
								range: nRangeToIRange(range),
								text: newText,
							},
						},
					],
				},
			})),
		),
		...autofixable.length === 0
			? []
			: [
				...[...new Set(autofixable.map(({code}) => code))].map(rule => {
					const related = autofixable.filter(({code}) => code === rule);
					return {
						title: `Fix all ${rule as string} problems`,
						isPreferred: true,
						kind: 'quickfix',
						diagnostics: markers
							.filter(marker => related.some(diagnostic => deepEqual(marker, diagnostic))),
						model: m,
						rule,
					};
				}),
				{
					title: 'Fix all auto-fixable problems',
					isPreferred: true,
					kind: 'quickfix',
					diagnostics: markers
						.filter(marker => autofixable.some(diagnostic => deepEqual(marker, diagnostic))),
					// @ts-expect-error extra property
					model: m,
				},
			],
	];
};

const getCodeActionList = (actions: languages.CodeAction[]): languages.CodeActionList | undefined =>
	actions.length === 0
		? undefined
		: {
			actions,
			dispose(this: {actions?: languages.CodeAction[]}): void {
				delete this.actions;
			},
		};

export const codeActionProvider: languages.CodeActionProvider = {
	provideCodeActions(m: IWikitextModel, _, context): languages.CodeActionList | undefined {
		return getCodeActionList(provideQuickFix(m, context));
	},
	resolveCodeAction,
};

export const codeActionProviderForWiki: languages.CodeActionProvider = {
	async provideCodeActions(m: IWikitextModel, range, context): Promise<languages.CodeActionList | undefined> {
		const {only} = context,
			actions = provideQuickFix(m, context);
		if (!only || /^refactor(?:$|\.)/u.test(only)) {
			const lsp = getLSP(m)!;
			if ('provideRefactoringAction' in lsp) {
				const versionId = m.getVersionId();
				actions.push(
					...(await lsp.provideRefactoringAction(m.getValue(), iRangeToNRange(range)))
						.map(({title, kind, edit}): languages.CodeAction => ({
							title,
							kind: kind!,
							edit: {
								edits: [
									{
										resource: m.uri,
										versionId,
										textEdit: {
											range,
											text: edit!.changes!['']![0]!.newText,
										},
									},
								],
							},
						})),
				);
			}
		}
		return getCodeActionList(actions);
	},
	resolveCodeAction,
};
