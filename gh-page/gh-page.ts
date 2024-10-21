(async () => {
	wikiparse.setConfig(await (await fetch('/wikiparser-node/config/default.json')).json() as Config);

	const container = document.querySelector<HTMLDivElement>('#container')!,
		languages = document.querySelectorAll<HTMLInputElement>('input[name="language"]'),
		editor = (await monaco).editor.create(container, {
			automaticLayout: true,
			theme: 'monokai',
			wordWrap: 'on',
			wordBreak: 'keepAll',
			glyphMargin: true,
			fontSize: 14,
			insertSpaces: false,
			renderLineHighlight: 'gutter',
		});

	/**
	 * 设置语言
	 * @param lang 语言
	 */
	const init = (lang: string): void => {
		if (editor.getModel()?.getLanguageId() !== lang) {
			const isMediaWiki = lang === 'wikitext';
			editor.setModel((monaco as unknown as Awaited<typeof monaco>).editor.createModel(editor.getValue(), lang));
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
