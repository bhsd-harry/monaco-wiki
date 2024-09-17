/* eslint-env node */
'use strict';

const config = require('@bhsd/common/eslintrc.dist.cjs');

module.exports = {
	...config,
	parserOptions: {
		...config.parserOptions,
		sourceType: 'module',
	},
	rules: {
		...config.rules,
		'es-x/no-object-fromentries': 0,
		'es-x/no-resizable-and-growable-arraybuffers': 0,
	},
};
