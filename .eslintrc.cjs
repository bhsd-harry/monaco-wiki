/* eslint-env node */
'use strict';

const config = require('@bhsd/code-standard/eslintrc.browser.cjs');

module.exports = {
	...config,
	env: {
		...config.env,
		worker: true,
	},
	ignorePatterns: [
		...config.ignorePatterns,
		'gh-page/*.js',
	],
	overrides: [
		...config.overrides,
		{
			files: 'src/*.ts',
			excludedFiles: 'src/all.ts',
			rules: {
				'no-restricted-globals': [
					2,
					'monaco',
				],
			},
		},
		{
			files: 'gh-page/*.ts',
			parserOptions: {
				project: 'gh-page/tsconfig.json',
			},
		},
		{
			files: 'test/*.ts',
			parserOptions: {
				project: 'test/tsconfig.json',
			},
		},
		{
			files: 'test/parserTests.json',
			rules: {
				'no-irregular-whitespace': 0,
			},
		},
	],
};
