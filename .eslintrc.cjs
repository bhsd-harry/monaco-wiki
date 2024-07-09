/* eslint-env node */
'use strict';

const config = require('@bhsd/common/eslintrc.browser.cjs');

module.exports = {
	...config,
	env: {
		...config.env,
		worker: true,
	},
	ignorePatterns: [
		...config.ignorePatterns,
		'gh-page/gh-page.js',
	],
	overrides: [
		...config.overrides,
		{
			files: 'gh-page/*.ts',
			parserOptions: {
				project: 'gh-page/tsconfig.json',
			},
		},
	],
};
