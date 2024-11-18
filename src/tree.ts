import type * as Monaco from 'monaco-editor';
import type {editor, IDisposable, Range as R, Position} from 'monaco-editor';
import type {AST} from 'wikiparser-node/base.ts';

declare type Tree = Promise<AST> & {docChanged?: boolean};

const trees = new WeakMap<editor.ITextModel, Tree>();

/**
 * 获取语法树
 * @param model 键
 * @param stage 解析阶段，现仅用于CodeMirror
 */
export const getTree = (model: editor.ITextModel, stage = 8): Tree => {
	let tree = trees.get(model);
	if (!tree || tree.docChanged) {
		tree = wikiparse.json(model.getValue(), true, -6, stage);
		trees.set(model, tree);
	}
	return tree;
};

export const listen = (model: editor.ITextModel): IDisposable => model.onDidChangeContent(() => {
	const tree = trees.get(model);
	if (tree) {
		tree.docChanged = true;
	}
});

export const fromPositions = (monaco: typeof Monaco, model: editor.ITextModel, ref: [number, number]): R =>
	monaco.Range.fromPositions(...ref.map(i => model.getPositionAt(i)) as [Position, Position]);
