import type * as Monaco from 'monaco-editor';
import type {languages, Position} from 'monaco-editor';
import type {Config} from 'wikiparser-node';

const completion = (monaco: typeof Monaco): languages.CompletionItemProvider => {
	monaco.editor.addKeybindingRule({
		keybinding: monaco.KeyMod.Shift | monaco.KeyCode.Enter, // eslint-disable-line no-bitwise
		command: 'editor.action.triggerSuggest',
	});

	/**
	 * 生成建议列表
	 * @param words 建议词
	 * @param kind 建议类型
	 * @param mt 匹配的文本
	 * @param pos 光标位置
	 * @param pos.lineNumber 行号
	 * @param pos.column 列号
	 */
	const getCompletion = (
		words: string[],
		kind: keyof typeof languages.CompletionItemKind,
		mt: string,
		{lineNumber, column}: Position,
	): languages.CompletionList => ({
		suggestions: words.map(w => ({
			label: w,
			kind: monaco.languages.CompletionItemKind[kind],
			insertText: w,
			range: new monaco.Range(lineNumber, column - mt.length, lineNumber, column),
		})),
	});
	let config: Config | undefined;
	return {
		triggerCharacters: ['#'],

		async provideCompletionItems(model, pos): Promise<languages.CompletionList | null> {
			if (!('wikiparse' in window)) {
				return null;
			}
			if (!config?.namespaces[1]) {
				config = await wikiparse.getConfig(); // eslint-disable-line require-atomic-updates
			}
			const before = model.getValueInRange(new monaco.Range(pos.lineNumber, 1, pos.lineNumber, pos.column)),
				mt = /(?:\{\{\s*(#[^|{}<>[\]#:]*)|__((?:(?!__)[\p{L}\d_])+)|<\/?([a-z\d]+)|(?:^|[^[])\[([a-z:/]+))$/iu
					.exec(before);
			if (!mt) {
				return null;
			} else if (mt[1]) {
				return getCompletion(Object.keys(config.parserFunction[0]), 'Function', mt[1], pos);
			} else if (mt[2]) {
				const {doubleUnderscore: [insensitive,, obj]} = config;
				if (obj && insensitive.length === 0) {
					insensitive.push(...Object.keys(obj));
				}
				return getCompletion((config.doubleUnderscore.slice(0, 2) as string[][]).flat(), 'Keyword', mt[2], pos);
			} else if (mt[3]) {
				return getCompletion([config.ext, config.html].flat(2), 'Property', mt[3], pos);
			} else if (mt[4]) {
				return getCompletion(config.protocol.split('|'), 'File', mt[4], pos);
			}
			throw new Error('Unknown completion type!');
		},
	} as languages.CompletionItemProvider;
};

export default completion;
