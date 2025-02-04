import {getLSP, nRangeToIRange} from './util.ts';
import type {languages} from 'monaco-editor';

export default {
	async provideLinks(model): Promise<languages.ILinksList | undefined> {
		const items = await getLSP(model)?.provideLinks(model.getValue());
		return items && {
			links: items.map(({target, range}) => ({
				url: target!,
				range: nRangeToIRange(range),
			}) satisfies languages.ILink),
		};
	},
} satisfies languages.LinkProvider;
