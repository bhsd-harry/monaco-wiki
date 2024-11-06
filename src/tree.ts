import type {editor, IDisposable} from 'monaco-editor';
import type {AST} from 'wikiparser-node/base.ts';

declare type Tree = Promise<AST> & {docChanged?: boolean};

const trees = new WeakMap<editor.ITextModel, Tree>();

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
