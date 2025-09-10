/* eslint-env node */
'use strict';

const esbuild = require('esbuild'),
	version = '0.52.2';

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
