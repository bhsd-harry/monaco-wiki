import type {languages, editor, IDisposable, Position} from 'monaco-editor';
import type {AST, TokenTypes} from 'wikiparser-node/base.ts';

declare type Ranges = [number, number][];
declare type Tree = Promise<AST> & {docChanged?: boolean};

const trees = new WeakMap<editor.ITextModel, Tree>();

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
	type: TokenTypes = 'ext',
): Ranges => {
	if (target === undefined) {
		return [];
	} else if (typeof target === 'string') {
		const matches = tree.type === type && tree.name === target,
			{childNodes, range} = tree,
			ranges = matches ? [range] : [];
		if (childNodes && (!matches || type !== 'ext')) {
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
	return (['arg-name', 'template-name', 'magic-word-name'] as (string | undefined)[]).includes(node.type)
		? findRef(model, tree, parentNode?.name, parentNode?.type)
		: [];
};

export const referenceProvider: languages.ReferenceProvider = {
	async provideReferences(model, pos) {
		if (!('wikiparse' in window)) {
			return null;
		}
		const {lineNumber} = pos,
			column = model.getWordAtPosition(pos)?.endColumn ?? pos.column,
			before = model.getValueInRange(new monaco.Range(lineNumber, 1, lineNumber, column)),
			mt1 = /(?:<(\w+)|\{\{[^|{}]+)$/u.exec(before);
		if (!mt1) {
			return null;
		}
		const tree = trees.get(model);
		if (!tree || tree.docChanged) {
			trees.set(model, wikiparse.json(model.getValue(), true, -6, 2) as Tree);
		}
		const refs = findRef(model, await (tree ?? trees.get(model)!), mt1[1]?.toLowerCase() ?? model.getOffsetAt(pos));
		return refs.length === 0
			? null
			: refs.map(ref => ({
				range: monaco.Range.fromPositions(...ref.map(i => model.getPositionAt(i)) as [Position, Position]),
				uri: model.uri,
			}));
	},
};

export const listen = (model: editor.ITextModel): IDisposable => model.onDidChangeContent(() => {
	const tree = trees.get(model);
	if (tree) {
		tree.docChanged = true;
	}
});