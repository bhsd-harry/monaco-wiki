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
		files: ['test/parserTests.json'],
		rules: {
			'no-irregular-whitespace': 0,
		},
	},
];
