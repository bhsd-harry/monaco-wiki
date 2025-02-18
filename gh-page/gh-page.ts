(async () => {
	localStorage.removeItem('codemirror-mediawiki-addons');

	const container = document.querySelector<HTMLDivElement>('#container')!,
		languages = [...document.querySelectorAll<HTMLInputElement>('input[name="language"]')],
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
	const init = async (lang: string): Promise<void> => {
		if (editor.getModel()?.getLanguageId() !== lang) {
			const isMediaWiki = lang === 'wikitext';
			if (isMediaWiki) {
				const config = await wikiparse.getConfig();
				Object.assign(config, {articlePath: 'https://mediawiki.org/wiki/$1'});
				wikiparse.setConfig(config);
			}
			editor.getModel()?.dispose();
			editor.setModel((monaco as unknown as Awaited<typeof monaco>).editor.createModel(editor.getValue(), lang));
			editor.updateOptions({
				wordWrap: isMediaWiki ? 'on' : 'off',
				unicodeHighlight: {
					ambiguousCharacters: !isMediaWiki,
				},
			});
		}
	};

	// 初始化语言
	for (const input of languages) {
		input.addEventListener('change', () => {
			void init(input.id);
			history.replaceState(null, '', `#${input.id.charAt(0).toUpperCase()}${input.id.slice(1)}`);
		});
		if (input.checked) {
			void init(input.id);
		}
	}
	const hashMap = new Map([
		['wiki', 'wikitext'],
		['wikitext', 'wikitext'],
		['mediawiki', 'wikitext'],
		['javascript', 'javascript'],
		['js', 'javascript'],
		['css', 'css'],
		['lua', 'lua'],
		['json', 'json'],
	]);
	addEventListener('hashchange', () => {
		const target = hashMap.get(location.hash.slice(1).toLowerCase()),
			element = languages.find(({id}) => id === target);
		if (element) {
			element.checked = true;
			element.dispatchEvent(new Event('change'));
		}
	});
	dispatchEvent(new Event('hashchange'));

	Object.assign(globalThis, {editor});
})();
