import '/monaco-wiki/dist/all.min.js';

(async () => {
	await window.monaco;
	const container = document.querySelector<HTMLTextAreaElement>('#container')!,
		languages = document.querySelectorAll<HTMLInputElement>('input[name="language"]'),
		editor = monaco.editor.create(container, {
			automaticLayout: true,
			theme: 'monokai',
			wordWrap: 'on',
			wordBreak: 'keepAll',
			glyphMargin: true,
			fontSize: 14,
			insertSpaces: false,
		});

	/**
	 * 设置语言
	 * @param lang 语言
	 */
	const init = (lang: string): void => {
		if (editor.getModel()?.getLanguageId() !== lang) {
			const isMediaWiki = lang === 'wikitext';
			editor.setModel(monaco.editor.createModel(editor.getValue(), lang));
			editor.updateOptions({
				wordWrap: isMediaWiki ? 'on' : 'off',
				unicodeHighlight: {
					ambiguousCharacters: !isMediaWiki,
				},
			});
		}
	};

	for (const input of languages) {
		input.addEventListener('change', () => {
			init(input.id);
		});
		if (input.checked) {
			init(input.id);
		}
	}
	Object.assign(window, {editor});
})();
