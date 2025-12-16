import {
	prepareDoneBtn,
	addOption,
	changeHandler,
	hashChangeHandler,
	inputHandler,
} from '/wikiparser-node/extensions/dist/test-page-common.js';

declare interface Test {
	desc: string;
	wikitext?: string;
}

(async () => {
	const tests: Test[] = await (await fetch('/wikiparser-node/test/parserTests.json')).json(),
		key = 'monaco-wiki-done',
		dones = new Set(JSON.parse(localStorage.getItem(key)!) as string[]),
		input = document.getElementById('search') as HTMLInputElement,
		select = document.querySelector('select')!,
		btn = document.querySelector('button')!,
		container = document.querySelector<HTMLDivElement>('#container')!,
		pre = document.querySelector('pre')!;
	localStorage.setItem('codemirror-mediawiki-addons', '[]');
	const m = (await monaco).editor.createModel('', 'wikitext'),
		editor = (await monaco).editor.create(container, {
			model: m,
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
	await wikiparse.highlight!(pre, false, true);
	let optgroup: HTMLOptGroupElement | undefined;
	for (let i = 0; i < tests.length; i++) {
		optgroup = addOption(optgroup, select, tests, dones, i);
	}
	select.addEventListener('change', () => {
		m.setValue(tests[Number(select.value)]!.wikitext!);
		changeHandler(pre, btn, select, tests);
	});
	prepareDoneBtn(btn, select, tests, dones, key);
	inputHandler(input, select, dones);
	hashChangeHandler(select, tests);
})();
