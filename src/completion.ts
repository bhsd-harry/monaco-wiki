import {commonHtmlAttrs, htmlAttrs, extAttrs} from 'wikiparser-node/dist/util/sharable.mjs';
import type * as Monaco from 'monaco-editor';
import type {languages, Position} from 'monaco-editor';
import type {Config} from 'wikiparser-node';

// eslint-disable-next-line @stylistic/max-len
const re = /(?:<\/?(\w+)|\{\{\s*(#[^|{}<>[\]#]*)|(__(?:(?!__)[\p{L}\d_])+)|(?:^|[^[])\[([a-z:/]+)|<(\w+)(?:\s(?:[^<>{}|=\s]+(?:\s*=\s*(?:[^\s"']\S*|(["']).*?\6))?(?=\s))*)?\s(\w+))$/iu;

export default (monaco: typeof Monaco): languages.CompletionItemProvider => {
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
		words: Iterable<string>,
		kind: keyof typeof languages.CompletionItemKind,
		mt: string,
		{lineNumber, column}: Position,
	): languages.CompletionList => ({
		suggestions: [...new Set(words)].map(w => ({
			label: w,
			kind: monaco.languages.CompletionItemKind[kind],
			insertText: w,
			range: new monaco.Range(lineNumber, column - mt.length, lineNumber, column),
		})),
	});

	let config: Config | undefined,
		tags: Set<string>,
		allTags: string[],
		functions: string[],
		switches: string[],
		protocols: string[];

	return {
		triggerCharacters: ['#'],

		async provideCompletionItems(model, pos): Promise<languages.CompletionList | null> {
			if (!('wikiparse' in globalThis)) {
				return null;
			} else if (!config?.namespaces[1]) {
				config = await wikiparse.getConfig(); // eslint-disable-line require-atomic-updates
				const {ext, html, parserFunction, doubleUnderscore, protocol} = config;
				tags = new Set([ext, html].flat(2));
				allTags = [...tags, 'onlyinclude', 'includeonly', 'noinclude'];
				functions = [Object.keys(parserFunction[0]), parserFunction.slice(1) as string[][]].flat(2);
				switches = (doubleUnderscore.slice(0, 2) as string[][]).flat().map(w => `__${w}__`);
				protocols = protocol.split('|');
			}
			const before = model.getValueInRange(new monaco.Range(pos.lineNumber, 1, pos.lineNumber, pos.column)),
				mt = re.exec(before);
			if (!mt) {
				return null;
			} else if (mt[1]) { // tag
				return getCompletion(allTags, 'Class', mt[1], pos);
			} else if (mt[2]) { // parser function
				return getCompletion(functions, 'Function', mt[2], pos);
			} else if (mt[3]) { // behavior switch
				return getCompletion(switches, 'Constant', mt[3], pos);
			} else if (mt[4]) { // protocol
				return getCompletion(protocols, 'Reference', mt[4], pos);
			} else if (mt[5]) { // attribute key
				const tag = mt[5].toLowerCase();
				if (!tags.has(tag)) {
					return null;
				}
				const key = mt[7]!,
					thisHtmlAttrs = htmlAttrs[tag],
					thisExtAttrs = extAttrs[tag],
					extCompletion = thisExtAttrs ? getCompletion(thisExtAttrs, 'Field', key, pos) : null;
				return config.ext.includes(tag) && !thisHtmlAttrs
					? extCompletion
					: {
						suggestions: [
							...extCompletion?.suggestions ?? [],
							...tag === 'meta' || tag === 'link'
								? []
								: getCompletion(commonHtmlAttrs, 'Property', key, pos).suggestions,
							...thisHtmlAttrs
								? getCompletion(thisHtmlAttrs, 'Property', key, pos).suggestions
								: [],
							...getCompletion(['data-'], 'Variable', key, pos).suggestions,
							...getCompletion(['xmlns:'], 'Interface', key, pos).suggestions,
						],
					};
			}
			throw new Error('Unknown completion type!');
		},
	} satisfies languages.CompletionItemProvider;
};
