import {nRangeToIRange, getLSP} from './util.ts';
import type {languages, IRange} from 'monaco-editor';
import type {ColorInformation} from 'vscode-languageserver-types';

export default {
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
} satisfies languages.DocumentColorProvider;
