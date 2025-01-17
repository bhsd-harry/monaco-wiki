"use strict";
(async () => {
    wikiparse.setConfig(await (await fetch('/wikiparser-node/config/default.json')).json());
    const container = document.querySelector('#container'), languages = [...document.querySelectorAll('input[name="language"]')], editor = (await monaco).editor.create(container, {
        automaticLayout: true,
        theme: 'monokai',
        wordWrap: 'on',
        wordBreak: 'keepAll',
        glyphMargin: true,
        fontSize: 14,
        insertSpaces: false,
        renderLineHighlight: 'gutter',
    });
    const init = (lang) => {
        var _a;
        if (((_a = editor.getModel()) === null || _a === void 0 ? void 0 : _a.getLanguageId()) !== lang) {
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
            location.hash = `#${input.id.charAt(0).toUpperCase()}${input.id.slice(1)}`;
        });
        if (input.checked) {
            init(input.id);
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
        const target = hashMap.get(location.hash.slice(1).toLowerCase()), element = languages.find(({ id }) => id === target);
        if (element) {
            element.checked = true;
            element.dispatchEvent(new Event('change'));
        }
    });
    dispatchEvent(new Event('hashchange'));
    Object.assign(globalThis, { editor });
})();
