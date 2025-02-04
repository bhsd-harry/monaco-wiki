/* eslint-disable jsdoc/require-jsdoc */
import {getLSP, iPositionToNPosition, nRangeToIRange} from './util.ts';
import type {languages} from 'monaco-editor';

export const referenceProvider: languages.ReferenceProvider = {
	async provideReferences(model, pos): Promise<languages.Location[] | undefined> {
		return (await getLSP(model)?.provideReferences(model.getValue(), iPositionToNPosition(pos)))
			?.map(({range}) => ({
				range: nRangeToIRange(range),
				uri: model.uri,
			}) satisfies languages.Location);
	},
};

export const highlightProvider: languages.DocumentHighlightProvider = {
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
