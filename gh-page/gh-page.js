"use strict";
(async () => {
    localStorage.removeItem('codemirror-mediawiki-addons');
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
    const init = async (lang) => {
        var _a, _b;
        if (((_a = editor.getModel()) === null || _a === void 0 ? void 0 : _a.getLanguageId()) !== lang) {
            const isMediaWiki = lang === 'wikitext';
            if (isMediaWiki) {
                const config = await wikiparse.getConfig();
                Object.assign(config, { articlePath: 'https://mediawiki.org/wiki/$1' });
                wikiparse.setConfig(config);
            }
            (_b = editor.getModel()) === null || _b === void 0 ? void 0 : _b.dispose();
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
        ['vue', 'vue'],
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
