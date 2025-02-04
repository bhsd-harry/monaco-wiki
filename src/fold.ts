import {getLSP} from './util.ts';
import type {languages} from 'monaco-editor';

export default {
	async provideFoldingRanges(model): Promise<languages.FoldingRange[] | undefined> {
		return (await getLSP(model)?.provideFoldingRanges(model.getValue()))?.map(({startLine, endLine}) => ({
			start: startLine + 1,
			end: endLine + 1,
		}) satisfies languages.FoldingRange);
	},
} satisfies languages.FoldingRangeProvider;
