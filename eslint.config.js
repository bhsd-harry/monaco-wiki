import config, {browser, getOxlintConfig} from '@bhsd/code-standard';

const oxlintConfig = getOxlintConfig([
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
]);

export default oxlintConfig;
