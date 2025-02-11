declare interface Test {
	desc: string;
	wikitext?: string;
}

(async () => {
	wikiparse.setConfig(await (await fetch('/wikiparser-node/config/default.json')).json() as Config);

	const tests: Test[] = await (await fetch('/wikiparser-node/test/parserTests.json')).json(),
		key = 'monaco-wiki-done',
		dones = new Set(JSON.parse(localStorage.getItem(key)!) as string[]),
		isGH = location.hostname.endsWith('.github.io'),
		select = document.querySelector('select')!,
		btn = document.querySelector('button')!,
		container = document.querySelector<HTMLDivElement>('#container')!,
		pre = document.querySelector('pre')!;
	Parser.config = await (await fetch('/wikiparser-node/config/default.json')).json();
	localStorage.setItem('codemirror-mediawiki-addons', '[]');
	const model = (await monaco).editor.createModel('', 'wikitext'),
		editor = (await monaco).editor.create(container, {
			model,
			automaticLayout: true,
			theme: 'monokai',
			readOnly: true,
			wordWrap: 'on',
			wordBreak: 'keepAll',
			fontSize: 14,
			renderLineHighlight: 'gutter',
			scrollBeyondLastLine: false,
			minimap: {enabled: false},
			unicodeHighlight: {ambiguousCharacters: false},
			inlayHints: {enabled: 'offUnlessPressed'},
		});
	Object.assign(globalThis, {editor});
	/** @implements */
	wikiparse.print = (wikitext, include, stage): Promise<[number, string, string][]> => {
		const printed = Parser.parse(wikitext, include, stage).print();
		return Promise.resolve([[stage ?? Infinity, wikitext, printed]]);
	};
	void wikiparse.highlight!(pre, false, true);
	btn.disabled = !select.value;
	if (!isGH) {
		btn.style.display = '';
	}
	let optgroup: HTMLOptGroupElement;
	for (const [i, {desc, wikitext}] of tests.entries()) {
		if (wikitext === undefined) {
			optgroup = document.createElement('optgroup');
			optgroup.label = desc;
			select.append(optgroup);
		} else if (isGH || !dones.has(desc)) {
			const option = document.createElement('option');
			option.value = String(i);
			option.textContent = desc;
			// @ts-expect-error already assigned
			optgroup.append(option);
		}
	}
	select.addEventListener('change', () => {
		const {wikitext, desc} = tests[Number(select.value)]!;
		model.setValue(wikitext!);
		pre.textContent = wikitext!;
		pre.classList.remove('wikiparser');
		void wikiparse.highlight!(pre, false, true);
		select.selectedOptions[0]!.disabled = true;
		btn.disabled = false;
		history.replaceState(null, '', `#${encodeURIComponent(desc)}`);
	});
	btn.addEventListener('click', () => {
		dones.add(tests[Number(select.value)]!.desc);
		localStorage.setItem(key, JSON.stringify([...dones]));
		select.selectedIndex++;
		select.dispatchEvent(new Event('change'));
	});
	addEventListener('hashchange', () => {
		const hash = decodeURIComponent(location.hash.slice(1)),
			i = tests.findIndex(({desc}) => desc === hash);
		if (i !== -1) {
			select.value = String(i);
			select.dispatchEvent(new Event('change'));
		}
	});
	dispatchEvent(new Event('hashchange'));
})();
