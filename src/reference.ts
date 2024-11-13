/* eslint-disable jsdoc/require-jsdoc */
import {getTree, fromPositions} from './tree.ts';
import type * as Monaco from 'monaco-editor';
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
 * @param selfOnly 是否查找自身
 */
const findRef = (
	model: editor.ITextModel,
	tree: AST,
	target?: string | number,
	type?: TokenTypes,
	selfOnly?: boolean,
): Ranges => {
	if (target === undefined) {
		return [];
	} else if (typeof target === 'string') {
		const matches = (type ? tree.type === type : tagTypes.has(tree.type)) && tree.name === target,
			{childNodes, range} = tree,
			ranges = [];
		if (matches) {
			ranges.push(tagTypes.has(tree.type) ? range : childNodes![0]!.range);
		}
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
	if (!parentNode || !braceTypes.has(node.type)) {
		return [];
	}
	return selfOnly ? [node.range] : findRef(model, tree, parentNode.name, parentNode.type);
};

async function provider(monaco: typeof Monaco, model: editor.ITextModel, pos: Position): Promise<Reference[] | null>;
async function provider(
	monaco: typeof Monaco,
	model: editor.ITextModel,
	pos: Position,
	newName: true,
): Promise<languages.RenameLocation | null>;
async function provider(
	monaco: typeof Monaco,
	model: editor.ITextModel,
	pos: Position,
	newName: string,
): Promise<languages.WorkspaceEdit | null>;
async function provider(
	monaco: typeof Monaco,
	model: editor.ITextModel,
	pos: Position,
	newName?: string | true,
): Promise<Reference[] | languages.RenameLocation | languages.WorkspaceEdit | null> {
	if (!('wikiparse' in window)) {
		return null;
	}
	const {lineNumber} = pos,
		column = model.getWordAtPosition(pos)?.endColumn ?? pos.column,
		before = model.getValueInRange(new monaco.Range(lineNumber, 1, lineNumber, column)),
		mt1 = /(?:<\/?(\w+)|(?:\{\{|\[\[)(?:[^|{}[\]<]|<!--)+)$/u.exec(before);
	if (!mt1 || mt1[1] && newName !== undefined) {
		return null;
	}
	const refs = findRef(
		model,
		await getTree(model),
		mt1[1]?.toLowerCase() ?? model.getOffsetAt(pos),
		undefined,
		newName === true,
	);
	if (refs.length === 0) {
		return null;
	} else if (newName === true) {
		const range = fromPositions(monaco, model, refs[0]!);
		return {range, text: model.getValueInRange(range)};
	}
	const {uri} = model,
		ranges = refs.map(ref => fromPositions(monaco, model, ref));
	return newName === undefined
		? ranges.map((range): Reference => ({range, uri, kind: 1}))
		: {
			edits: ranges.map((range): languages.IWorkspaceTextEdit => ({
				resource: uri,
				textEdit: {range, text: newName},
				versionId: model.getVersionId(),
			})),
		};
}

export const referenceProvider = (monaco: typeof Monaco): languages.ReferenceProvider => ({
	provideReferences(model, pos) {
		return provider(monaco, model, pos);
	},
}) as languages.ReferenceProvider;

export const highlightProvider = (monaco: typeof Monaco): languages.DocumentHighlightProvider => ({
	provideDocumentHighlights(model, pos) {
		return provider(monaco, model, pos);
	},
}) as languages.DocumentHighlightProvider;

export const renameProvider = (monaco: typeof Monaco): languages.RenameProvider => ({
	provideRenameEdits(model, pos, newName) {
		return provider(monaco, model, pos, newName);
	},
	async resolveRenameLocation(model, pos) {
		return await provider(monaco, model, pos, true) ?? {
			range: new monaco.Range(1, 1, 1, 1),
			text: '',
			rejectReason: 'You cannot rename this element.',
		};
	},
}) as languages.RenameProvider;
