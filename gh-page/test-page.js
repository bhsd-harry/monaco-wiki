"use strict";
(async () => {
    const tests = await (await fetch('/wikiparser-node/test/parserTests.json')).json(), select = document.querySelector('select'), container = document.querySelector('#container'), pre = document.querySelector('pre');
    Parser.config = await (await fetch('/wikiparser-node/config/default.json')).json();
    localStorage.setItem('codemirror-mediawiki-addons', '[]');
    const model = monaco.editor.createModel('', 'wikitext'), editor = monaco.editor.create(container, {
        model,
        automaticLayout: true,
        theme: 'monokai',
        readOnly: true,
        wordWrap: 'on',
        wordBreak: 'keepAll',
        fontSize: 14,
        scrollBeyondLastLine: false,
        minimap: { enabled: false },
        unicodeHighlight: { ambiguousCharacters: false },
    });
    Object.assign(window, { editor });
    wikiparse.print = (wikitext, include, stage) => {
        const printed = Parser.parse(wikitext, include, stage).print();
        return Promise.resolve([[stage !== null && stage !== void 0 ? stage : Infinity, wikitext, printed]]);
    };
    void wikiparse.highlight(pre, false, true);
    let optgroup;
    for (const [i, { desc, wikitext }] of tests.entries()) {
        if (wikitext === undefined) {
            optgroup = document.createElement('optgroup');
            optgroup.label = desc;
            select.append(optgroup);
        }
        else {
            const option = document.createElement('option');
            option.value = String(i);
            option.textContent = desc;
            optgroup.append(option);
        }
    }
    select.addEventListener('change', () => {
        const { wikitext } = tests[Number(select.value)];
        model.setValue(wikitext);
        pre.textContent = wikitext;
        pre.classList.remove('wikiparser');
        void wikiparse.highlight(pre, false, true);
        select.selectedOptions[0].disabled = true;
    });
})();
