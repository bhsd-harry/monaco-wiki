import {getTree} from './tree.ts';
import type {languages, editor, Position, Range as R, Uri} from 'monaco-editor';
import type {AST, TokenTypes} from 'wikiparser-node/base.ts';

declare type Ranges = [number, number][];
declare interface Reference {
	range: R;
	uri: Uri;
	kind: 1;
}

const tagTypes = new Set<string | undefined>(['ext', 'html']),
	braceTypes = new Set<string | undefined>(['arg-name', 'template-name', 'magic-word-name', 'link-target']);

/**
 * 查找引用
 * @param model 文档模型
 * @param tree 语法树
 * @param target 目标名称或位置
 * @param type 节点类型
 */
const findRef = (
	model: editor.ITextModel,
	tree: AST,
	target?: string | number,
	type?: TokenTypes,
): Ranges => {
	if (target === undefined) {
		return [];
	} else if (typeof target === 'string') {
		const matches = (type ? tree.type === type : tagTypes.has(tree.type)) && tree.name === target,
			{childNodes, range} = tree,
			ranges = matches ? [range] : [];
		if (childNodes && (!matches || !tagTypes.has(type))) {
			ranges.push(...childNodes.flatMap(child => findRef(model, child, target, type)));
		}
		return ranges;
	}
	let node = tree,
		parentNode: AST | undefined;
	while (node.childNodes) {
		const child = node.childNodes.find(({range: [from, end]}) => from < target && end >= target);
		if (child?.childNodes) {
			parentNode = node;
			node = child;
		} else {
			break;
		}
	}
	return braceTypes.has(node.type) ? findRef(model, tree, parentNode?.name, parentNode?.type) : [];
};

const provider = async (model: editor.ITextModel, pos: Position): Promise<Reference[] | null> => {
	if (!('wikiparse' in window)) {
		return null;
	}
	const {lineNumber} = pos,
		column = model.getWordAtPosition(pos)?.endColumn ?? pos.column,
		before = model.getValueInRange(new monaco.Range(lineNumber, 1, lineNumber, column)),
		mt1 = /(?:<\/?(\w+)|(?:\{\{|\[\[)(?:[^|{}[\]<]|<!--)+)$/u.exec(before);
	if (!mt1) {
		return null;
	}
	const refs = findRef(model, await getTree(model), mt1[1]?.toLowerCase() ?? model.getOffsetAt(pos));
	return refs.length === 0
		? null
		: refs.map((ref): Reference => ({
			range: monaco.Range.fromPositions(...ref.map(i => model.getPositionAt(i)) as [Position, Position]),
			uri: model.uri,
			kind: 1,
		}));
};

export const referenceProvider: languages.ReferenceProvider = {provideReferences: provider};

export const highlightProvider: languages.DocumentHighlightProvider = {provideDocumentHighlights: provider};
