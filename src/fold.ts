import {getTree} from './tree.ts';
import type {languages, editor} from 'monaco-editor';
import type {AST} from 'wikiparser-node/base.ts';

const types = new Set<string | undefined>(['table', 'template', 'magic-word']);

const fold = (
	model: editor.ITextModel,
	{type, range: [from, to], childNodes = [], level}: AST & {level?: number},
	ranges: languages.FoldingRange[],
	levels: (number | undefined)[],
): void => {
	const {lineNumber} = model.getPositionAt(from),
		{lineNumber: end, column} = model.getPositionAt(to);
	if (type === 'heading') {
		for (let i = level! - 1; i < 6; i++) {
			const start = levels[i];
			if (start !== undefined && start < lineNumber - 1) {
				ranges.push({start, end: lineNumber - 1});
			}
		}
		levels[level! - 1] = end - (column === 1 ? 1 : 0);
	} else if (types.has(type) && end - lineNumber > 1) {
		ranges.push({start: lineNumber, end: end - 1});
	}
	for (const child of childNodes) {
		fold(model, child, ranges, levels);
	}
};

const foldProvider = {
	async provideFoldingRanges(model) {
		const ranges: languages.FoldingRange[] = [],
			l = model.getLineCount(),
			root = await getTree(model),
			levels = new Array<number | undefined>(6);
		fold(model, root, ranges, levels);
		for (const line of levels) {
			if (line !== undefined && line < l) {
				ranges.push({start: line, end: l});
			}
		}
		return ranges.length > 0 ? ranges : null;
	},
} as languages.FoldingRangeProvider;

export default foldProvider;