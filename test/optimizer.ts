import assert from 'assert';
import {optimize} from 'oniguruma-parser/optimizer';
import wikitext from '../src/wikitext.tmLanguage.js';
import type {IRawRule} from '../src/wikitext.tmLanguage.js';

const validateRule = (rule: IRawRule): void => {
	if ('match' in rule) {
		// eslint-disable-next-line es-x/no-regexp-lookbehind-assertions
		const re = (rule.match as string).replace(/(?<=\((?:\?:)?)\$\d+(?=\))/gu, 'ab|cd');
		assert.strictEqual(optimize(re).pattern, re, `${rule.name}\n${rule.match}`);
	}
	if ('patterns' in rule) {
		for (const pattern of rule.patterns) {
			validateRule(pattern);
		}
	}
	validateCaptures(rule.captures);
	validateCaptures(rule.beginCaptures);
	validateCaptures(rule.endCaptures);
};

const validateCaptures = (captures: IRawRule['captures']): void => {
	if (captures) {
		for (const capture of Object.values(captures)) {
			validateRule(capture);
		}
	}
};

const validateRepository = (repository: IRawRule['repository']): void => {
	if (repository) {
		for (const rule of Object.values(repository)) {
			validateRule(rule);
		}
	}
};

validateRepository(wikitext.repository);
