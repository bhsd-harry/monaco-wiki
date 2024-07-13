declare interface Test {
	desc: string;
	wikitext?: string;
}

(async () => {
	const tests: Test[] = await (await fetch('/wikiparser-node/test/parserTests.json')).json(),
		select = document.querySelector('select')!,
		container = document.querySelector<HTMLDivElement>('#container')!,
		pre = document.querySelector('pre')!;
	Parser.config = await (await fetch('/wikiparser-node/config/default.json')).json();
	localStorage.setItem('codemirror-mediawiki-addons', '[]');
	const model = monaco.editor.createModel('', 'wikitext'),
		editor = monaco.editor.create(container, {
			model,
			automaticLayout: true,
			theme: 'monokai',
			readOnly: true,
			wordWrap: 'on',
			wordBreak: 'keepAll',
			fontSize: 14,
			scrollBeyondLastLine: false,
			minimap: {enabled: false},
			unicodeHighlight: {ambiguousCharacters: false},
		});
	Object.assign(window, {editor});
	/** @implements */
	wikiparse.print = (wikitext, include, stage): Promise<[number, string, string][]> => {
		const printed = Parser.parse(wikitext, include, stage).print();
		return Promise.resolve([[stage ?? Infinity, wikitext, printed]]);
	};
	void wikiparse.highlight!(pre, false, true);
	let optgroup: HTMLOptGroupElement;
	for (const [i, {desc, wikitext}] of tests.entries()) {
		if (wikitext === undefined) {
			optgroup = document.createElement('optgroup');
			optgroup.label = desc;
			select.append(optgroup);
		} else {
			const option = document.createElement('option');
			option.value = String(i);
			option.textContent = desc;
			// @ts-expect-error already assigned
			optgroup.append(option);
		}
	}
	select.addEventListener('change', () => {
		const {wikitext} = tests[Number(select.value)]!;
		model.setValue(wikitext!);
		pre.textContent = wikitext!;
		pre.classList.remove('wikiparser');
		void wikiparse.highlight!(pre, false, true);
		select.selectedOptions[0]!.disabled = true;
	});
})();
