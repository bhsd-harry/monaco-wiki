import '/monaco-wiki/dist/all.min.js';
(async () => {
    await window.monaco;
    const container = document.querySelector('#container'), languages = document.querySelectorAll('input[name="language"]'), editor = monaco.editor.create(container, {
        automaticLayout: true,
        theme: 'monokai',
        wordWrap: 'on',
        wordBreak: 'keepAll',
        glyphMargin: true,
        fontSize: 14,
        insertSpaces: false,
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
        });
        if (input.checked) {
            init(input.id);
        }
    }
    Object.assign(window, { editor });
})();
