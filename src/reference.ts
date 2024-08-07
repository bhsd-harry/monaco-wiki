import type {languages, editor, IDisposable, Position} from 'monaco-editor';
import type {AST} from 'wikiparser-node/base.ts';

declare type ExtToken = AST & {name?: string};
declare type Ranges = [number, number][];
declare type Tree = Promise<AST> & {docChanged?: boolean};

const trees = new WeakMap<editor.ITextModel, Tree>();

/**
 * 查找引用
 * @param model 文档模型
 * @param tree 语法树
 * @param target 目标名称
 */
const findRef = (model: editor.ITextModel, tree: ExtToken, target: string): Ranges =>
	tree.type === 'ext' && tree.name === target
		? [tree.range]
		: (tree.childNodes ?? []).flatMap(child => findRef(model, child, target));

export const referenceProvider: languages.ReferenceProvider = {
	async provideReferences(model, pos) {
		const {lineNumber} = pos,
			column = model.getWordAtPosition(pos)?.endColumn ?? pos.column,
			before = model.getValueInRange(new monaco.Range(lineNumber, 1, lineNumber, column)),
			mt1 = /<(\w+)$/u.exec(before);
		if (!mt1) {
			return null;
		}
		const tree = trees.get(model);
		if (!tree || tree.docChanged) {
			trees.set(model, wikiparse.json(model.getValue(), true, -6, 2) as Tree);
		}
		const refs = findRef(model, await (tree ?? trees.get(model)!), mt1[1]!.toLowerCase());
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
