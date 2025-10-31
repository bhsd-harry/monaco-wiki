import config, {browser} from '@bhsd/code-standard';

export default [
	{
		ignores: ['gh-page/*.js'],
	},
	...config,
	browser,
	{
		files: ['src/*.ts'],
		ignores: ['src/all.ts'],
		rules: {
			'no-restricted-globals': [
				2,
				'monaco',
			],
		},
	},
	{
		files: ['gh-page/*.ts'],
		languageOptions: {
			parserOptions: {
				project: 'gh-page/tsconfig.json',
			},
		},
	},
	{
		files: ['test/*.ts'],
		languageOptions: {
			parserOptions: {
				project: 'test/tsconfig.json',
			},
		},
	},
	{
		files: ['bundle/*.ts'],
		languageOptions: {
			parserOptions: {
				project: 'bundle/tsconfig.json',
			},
		},
	},
	{
		files: ['test/parserTests.json'],
		rules: {
			'no-irregular-whitespace': 0,
		},
	},
];
