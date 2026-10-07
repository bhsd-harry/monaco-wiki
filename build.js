import path from 'path';
import fs from 'fs';
import esbuild from 'esbuild';

const /** @type {esbuild.BuildOptions} */ config = {
		charset: 'utf8',
		bundle: true,
		format: 'esm',
		logLevel: 'info',
	},
	/** @type {esbuild.BuildOptions} */ minConfig = {
		...config,
		minify: true,
		target: 'es2019',
		sourcemap: true,
	},
	vuePlugin = {
		name: 'alias',
		setup(build) {
			build.onResolve(
				// eslint-disable-next-line require-unicode-regexp
				{filter: /\/(?:typescript|markdown-vue)\.mjs$/},
				() => ({path: path.resolve('shim.js')}),
			);
			build.onLoad(
				{
					// eslint-disable-next-line require-unicode-regexp
					filter: /\/@shikijs\/(?:langs\/dist\/vue\.mjs|vscode-textmate\/dist\/index\.js)$/,
				},
				({path: p}) => {
					const contents = fs.readFileSync(p, 'utf8');
					return {
						contents: contents.replaceAll(
							/,\\"embeddedLangs\\":\[.+?\](?=[,}])|var DebugFlags = \{$[\s\S]+?^\};$/gmu,
							'',
						),
					};
				},
			);
		},
	};

(async () => {
	await esbuild.build({
		...config,
		entryPoints: ['src/main.ts'],
		outdir: 'dist',
		external: ['@bhsd', '@shikijs', 'shiki'],
	});
	await esbuild.build({
		...config,
		entryPoints: fs.globSync('bundle/*.ts'),
		outdir: 'build',
		plugins: [vuePlugin],
	});
	await esbuild.build({
		...config,
		entryPoints: ['src/main.ts', 'src/wiki.ts', 'src/all.ts'],
		outdir: 'build',
		plugins: [vuePlugin],
	});
	await esbuild.build({
		...minConfig,
		entryPoints: ['src/main.ts'],
		outfile: 'dist/main.min.js',
		plugins: [vuePlugin],
	});
	await esbuild.build({
		...minConfig,
		entryPoints: ['src/wiki.ts'],
		outfile: 'dist/wiki.min.js',
	});
	await esbuild.build({
		...minConfig,
		format: 'iife',
		entryPoints: ['src/all.ts'],
		outfile: 'dist/all.min.js',
		plugins: [vuePlugin],
	});
})();
