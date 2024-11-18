import {splitColors, numToHex} from '@bhsd/common';
import {getTree, fromPositions} from './tree.ts';
import type * as Monaco from 'monaco-editor';
import type {languages, editor} from 'monaco-editor';
import type {AST} from 'wikiparser-node/base.ts';

/**
 * 查找颜色
 * @param monaco Monaco
 * @param model 文档模型
 * @param tree 语法树
 */
const findColors = (monaco: typeof Monaco, model: editor.ITextModel, tree: AST): languages.IColorInformation[] => {
	const {type, childNodes} = tree;
	if (!childNodes) {
		return [];
	} else if (
		type !== 'attr-value'
		&& (type !== 'parameter-value' && type !== 'arg-default' || childNodes.length !== 1)
	) {
		return childNodes.flatMap(child => findColors(monaco, model, child));
	}
	return childNodes.flatMap(
		({childNodes: ch, data, range: [start]}) => ch
			? ch.flatMap(child => findColors(monaco, model, child))
			: splitColors(data!, false).filter(([,,, isColor]) => isColor)
				.map(([s, from, to]): languages.IColorInformation => {
					const range = fromPositions(monaco, model, [start + from, start + to]);
					if (s.startsWith('#')) {
						const short = s.length < 7;
						return {
							color: {
								red: parseInt(short ? s.charAt(1).repeat(2) : s.slice(1, 3), 16) / 255,
								green: parseInt(short ? s.charAt(2).repeat(2) : s.slice(3, 5), 16) / 255,
								blue: parseInt(short ? s.charAt(3).repeat(2) : s.slice(5, 7), 16) / 255,
								alpha: parseInt((short ? s.charAt(4).repeat(2) : s.slice(7, 9)) || 'ff', 16) / 255,
							},
							range,
						};
					}
					const values = s.slice(s.indexOf('(') + 1, -1).split(/\s+(?:[,/]\s*)?|[,/]\s*/u)
						.map(v => parseFloat(v) / (v.endsWith('%') ? 100 : 1)) as [number, number, number, number?];
					return {
						color: {
							red: values[0] / 255,
							green: values[1] / 255,
							blue: values[2] / 255,
							alpha: values[3] ?? 1,
						},
						range,
					};
				}),
	);
};

const colorProvider = (monaco: typeof Monaco): languages.DocumentColorProvider => ({
	async provideDocumentColors(model) {
		return 'wikiparse' in window ? findColors(monaco, model, await getTree(model)) : null;
	},
	provideColorPresentations(_, {color, range}) {
		const text = `#${numToHex(color.red)}${numToHex(color.green)}${numToHex(color.blue)}${
			color.alpha < 1 ? numToHex(color.alpha) : ''
		}`;
		return [
			{
				label: text,
				textEdit: {range, text},
			},
		];
	},
}) as languages.DocumentColorProvider;

export default colorProvider;
