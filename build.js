import path from 'path';
import fs from 'fs';
import esbuild from 'esbuild';

const /** @type {esbuild.Plugin} */ plugin = {
	name: 'alias',
	setup(build) {
		build.onResolve(
			// eslint-disable-next-line require-unicode-regexp
			{filter: /^\.\/(?:typescript|markdown-vue)\.mjs$/},
			() => ({path: path.resolve('shim.js')}),
		);
		build.onLoad(
			// eslint-disable-next-line require-unicode-regexp
			{filter: /\/@shikijs\/langs\/dist\/vue\.mjs$/},
			({path: p}) => {
				const contents = fs.readFileSync(p, 'utf8');
				return {
					contents: contents.replace(/,\\"embeddedLangs\\":\[.+?\](?=,)/u, ''),
				};
			},
		);
	},
};

const /** @type {esbuild.BuildOptions} */ config = {
	charset: 'utf8',
	bundle: true,
	format: 'esm',
	logLevel: 'info',
	plugins: [plugin],
};

(async () => {
	await esbuild.build({
		...config,
		entryPoints: fs.globSync('bundle/*.ts'),
		outdir: 'build',
	});
	await esbuild.build({
		...config,
		entryPoints: ['src/main.ts', 'src/all.ts'],
		outdir: 'build',
	});
	await esbuild.build({
		...config,
		minify: true,
		target: 'es2019',
		entryPoints: ['src/main.ts'],
		outfile: 'dist/main.min.js',
	});
	await esbuild.build({
		...config,
		minify: true,
		target: 'es2019',
		sourcemap: true,
		format: 'iife',
		entryPoints: ['src/all.ts'],
		outfile: 'dist/all.min.js',
	});
})();
