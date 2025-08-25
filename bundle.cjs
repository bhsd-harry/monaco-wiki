/* eslint-env node */
'use strict';

const esbuild = require('esbuild'),
	{version} = require('monaco-editor/package.json');

esbuild.buildSync({
	entryPoints: ['src/all.ts'],
	charset: 'utf8',
	bundle: true,
	format: 'esm',
	outfile: 'build/all.js',
	define: {
		$VERSION: JSON.stringify(version),
	},
	logLevel: 'info',
});
