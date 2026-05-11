import type {IRawGrammar} from '@shikijs/vscode-textmate';
import type {LanguageRegistration} from 'shiki/core';

export type IRawRule = IRawGrammar['patterns'][0];

/**
 * @author Rowe Wilson Frederisk Holme
 * @author Bhsd
 * @license MIT
 * @see https://github.com/Frederisk/Wikitext-VSCode-Extension/blob/master/syntaxes/wikitext.tmLanguage.yaml
 */
export default /* #__PURE__ */((): LanguageRegistration => {
	const extEnd = String.raw`(?i)(</)(\2)\s*(>)`,
		pipe = String.raw`\|`,
		tagBegin = {name: 'punctuation.definition.tag.begin.wikitext'},
		tagEnd = {name: 'punctuation.definition.tag.end.wikitext'},
		tagName = {name: 'entity.name.tag.wikitext'},
		attribute = {include: 'text.html.basic#attribute'},
		templateEnd = '(}})',
		argEnd = '(?=}}})',
		linkBracket = {name: 'punctuation.definition.tag.link.wikitext'},
		invalid = 'invalid.deprecated.ineffective.wikitext',
		invalidRule = {name: invalid},
		$self = {include: '$self'},
		pipeOp = 'keyword.operator.wikitext',
		pipeRule = {name: pipeOp},
		namespace = {name: 'entity.name.tag.namespace.wikitext'},
		indent = 'punctuation.definition.list.begin.markdown.wikitext',
		delimiter = String.raw`\||\{\{\s*!\s*}}`,
		link = 'string.quoted.internal-link.wikitext',
		linkEnd = '(]])',
		tagWithAttribute = {
			1: tagBegin,
			2: tagName,
			3: {patterns: [attribute]},
			4: tagEnd,
		},
		tagWithoutAttribute = {
			1: tagBegin,
			2: tagName,
			3: tagEnd,
		},
		replaced = [
			{include: '#wikixml'},
			{include: '#argument'},
			{include: '#magic-words'},
			{include: '#template'},
		],
		attrs = [
			...replaced,
			attribute,
		],
		pageName = {
			name: 'entity.other.attribute-name.wikitext',
			patterns: [
				{
					match: '(?i)%(?:3[ce]|[57][bd])',
					name: invalid,
				},
			],
		},
		tdInner = {
			name: 'markup.style.wikitext',
			patterns: [$self],
		},
		pipePattern = {
			match: pipe,
			name: pipeOp,
		},
		imgKey = {
			1: pipeRule,
			2: {name: 'entity.other.attribute-name.localname.wikitext'},
		};

	/**
	 * @ignore
	 * @todo 不会匹配包含换行符的标签
	 */
	const extBegin = (suffix = '>'): string => String.raw`(?i)(<)($1)(\s[^>]*)?(${suffix})`,
		parserFunctions = (caseSensitive?: boolean): IRawRule => ({
			begin: String.raw`${caseSensitive ? '' : '(?i)'}(\{\{)\s*(${
				caseSensitive ? String.raw`#[^]#:\[{|}]*[^]#:\[{|}\s]|` : ''
			}$1)(:)`,
			end: templateEnd,
			captures: {
				1: {name: 'punctuation.definition.tag.function.wikitext'},
				2: {name: 'constant.language.variables.query.wikitext'},
				3: {name: 'keyword.operator.function.wikitext'},
			},
			patterns: [
				pipePattern,
				$self,
			],
		}),
		td = (subtype: string, begin: string, th?: boolean): IRawRule => {
			const match = String.raw`(.*?)((?:${delimiter}){2}|\{\{\s*!!\s*}}${th ? '|!!' : ''}|$)`;
			return {
				name: `meta.tag.block.${subtype}.wikitext`,
				begin: String.raw`^\s*${begin}`,
				beginCaptures: {0: pipeRule},
				end: '$',
				patterns: [
					{
						match: String.raw`(${
							th ? '(?:(?!!!)' : ''
						}[^]\[{|}]${th ? ')' : ''}*)(${delimiter})(?!${delimiter})${match}`,
						captures: {
							1: {patterns: attrs},
							2: pipeRule,
							3: tdInner,
							4: pipeRule,
						},
					},
					{
						match,
						captures: {
							1: tdInner,
							2: pipeRule,
						},
					},
				],
			};
		};

	const signature = {
			name: 'keyword.other.signature.wikitext',
			match: '~{3,5}',
		},
		redirect = {
			match: String.raw`(?i)^\s*($1)\s*((?::\s*)?\[\[)(\s*(?::\s*)?(?:$2)\s*:)?([^]<>\[{|}]+)(\|.*?)?(]])`,
			captures: {
				1: {name: 'keyword.control.redirect.wikitext'},
				2: linkBracket,
				3: namespace,
				4: pageName,
				5: invalidRule,
				6: linkBracket,
			},
		},
		onlyinclude = {
			contentName: 'meta.block.onlyinclude.wikitext',
			begin: '(<)(onlyinclude)(>)',
			end: '(</)(onlyinclude)(>)',
			captures: tagWithoutAttribute,
			patterns: [$self],
		},
		noinclude = {
			patterns: [
				{
					match: String.raw`(?i)(<)(includeonly|noinclude)(\s[^>]*)?(/?>)`,
					captures: tagWithAttribute,
				},
				{
					match: String.raw`(?i)(</)(includeonly|noinclude)\s*(>)`,
					captures: tagWithoutAttribute,
				},
			],
		},
		selfClosedTags = {
			match: extBegin('/>'),
			captures: tagWithAttribute,
		},
		ref = {
			contentName: 'meta.block.ref.wikitext',
			begin: extBegin(),
			beginCaptures: tagWithAttribute,
			end: extEnd,
			endCaptures: tagWithoutAttribute,
			patterns: [$self],
		},
		json = {
			contentName: 'meta.embedded.block.json',
			begin: extBegin(),
			beginCaptures: tagWithAttribute,
			end: extEnd,
			endCaptures: tagWithoutAttribute,
			patterns: [{include: 'source.json'}],
		},
		nowiki = {
			contentName: 'meta.embedded.block.plaintext',
			begin: extBegin(),
			beginCaptures: tagWithAttribute,
			end: extEnd,
			endCaptures: tagWithoutAttribute,
			patterns: [{include: 'text.html.basic#entities'}],
		},
		argument = {
			contentName: 'variable.parameter.wikitext',
			begin: String.raw`(?<!(?<!\{)\{)(\{\{\{)(?!\{|\s*!\s*}}(?!}))([^{|}]*)`,
			end: '(}}})',
			captures: {
				1: {name: 'punctuation.definition.tag.variable.wikitext'},
				2: {name: 'variable.other.wikitext'},
			},
			patterns: [
				{
					begin: pipe,
					beginCaptures: {0: pipeRule},
					end: argEnd,
					patterns: [
						{
							name: invalid,
							begin: pipe,
							end: argEnd,
						},
						$self,
					],
				},
			],
		},
		variables = {
			name: 'constant.language.variables.metadata.wikitext',
			match: String.raw`(?i)\{\{\s*(?:$1)\s*}}|\{\{\s*(?:$2)\s*}}`,
		},
		parserFunction = {
			patterns: [
				parserFunctions(),
				parserFunctions(true),
			],
		},
		template = {
			begin: String.raw`(\{\{)(\s*(?::\s*)?(?:$1)\s*:)?([^]#<>\[{|}]+)(#[^<>{|}]*)?`,
			end: templateEnd,
			captures: {
				1: {name: 'punctuation.definition.tag.template.wikitext'},
				2: namespace,
				3: {
					name: 'entity.name.tag.local-name.wikitext',
					patterns: [
						{
							match: String.raw`(?i)%[a-f\d]{2}`,
							name: invalid,
						},
					],
				},
				4: invalidRule,
			},
			patterns: [
				{
					match: String.raw`(\|)([^]<=>\[{|}]*)(=)`,
					captures: {
						1: pipeRule,
						2: {
							name: 'entity.other.attribute-name.local-name.wikitext',
							patterns: [$self],
						},
						3: {name: 'keyword.operator.equal.wikitext'},
					},
				},
				pipePattern,
				$self,
			],
		},
		comment = {
			name: 'comment.block.html',
			begin: '<!--',
			end: '-->',
			captures: {
				0: {name: 'punctuation.definition.comment.html'},
			},
		},
		heading = {
			name: 'markup.heading.wikitext',
			match: String.raw`^((?:<!--(?:(?!-->).)*-->)*)(={1,6})(.+)(\2)((?:\s|<!--(?:(?!-->).)*-->)*)$`,
			captures: {
				1: {patterns: [{include: '#comment'}]},
				3: {
					name: 'string.quoted.other.heading.wikitext',
					patterns: [$self],
				},
				5: {patterns: [{include: '#comment'}]},
			},
		},
		table = {
			name: 'meta.tag.block.table.wikitext',
			begin: String.raw`^(\s*(?::+\s*)?)(\{(?:\||\{(?:\{\s*|\s*\()!\s*}}))(.*)$`,
			end: String.raw`^(\s*)(\|}|\{\{\s*!(?:\s*}|\)\s*)}})`,
			captures: {
				1: {name: indent},
				2: pipeRule,
				3: {patterns: attrs},
			},
			patterns: [
				{
					name: 'meta.tag.block.table-row.wikitext',
					match: String.raw`^\s*((?:${delimiter})-+(?!-))(.*)$`,
					captures: {
						1: pipeRule,
						2: {patterns: attrs},
					},
				},
				td('th', '!', true),
				td('td', String.raw`(?:${delimiter})\+?`),
				$self,
			],
		},
		behaviorSwitches = {
			patterns: [
				{
					name: 'constant.language.behavior.wikitext',
					match: '(?i)__(?:$1)__',
				},
				{
					name: 'constant.language.switcher.wikitext',
					match: '__(?:$1)__',
				},
			],
		},
		hr = {
			match: '^-{4,}',
			name: 'markup.changed.wikitext',
		},
		fileLink = {
			name: link,
			begin: String.raw`(?i)(\[\[)(?!\[)[^\S\n]*((?:$1)[^\S\n]*:)([^]\n#<>\[{|}]+)(#[^]\n\[{|}]*)?`,
			end: linkEnd,
			captures: {
				1: linkBracket,
				2: namespace,
				3: pageName,
				4: invalidRule,
			},
			patterns: [
				{
					match: String.raw`(\|)\s*((?:$1)\s*(?=\||]])|$2)`,
					captures: imgKey,
				},
				{
					match: String.raw`(\|)\s*[\dx]+(?:px)?($1)\s*(?=\||]])`,
					captures: imgKey,
				},
				{
					match: String.raw`(\|)\s*\d+($1)\s*(?=\||]])`,
					captures: imgKey,
				},
				pipePattern,
				$self,
			],
		},
		internalLink = {
			name: link,
			begin: // eslint-disable-next-line @stylistic/max-len
			String.raw`(?i)(?<!(?<!\[)\[)(\[\[)(?!\[)(?!$1)(\s*(?::\s*)?(?:$2)\s*:)?([^]\n#<>\[{|}]*(?:#[^]\n\[{|}]*)?)`,
			end: linkEnd,
			captures: {
				1: linkBracket,
				2: namespace,
				3: pageName,
			},
			patterns: [
				{
					begin: pipe,
					beginCaptures: {0: pipeRule},
					end: '(?=]])',
					patterns: [$self],
				},
				{
					match: String.raw`[]>\[}]`,
					name: invalid,
				},
				{include: '#comment'},
				{include: '#wikixml'},
				{include: '#argument'},
				{include: '#magic-words'},
				{include: '#template'},
			],
		},
		fontStyle = {
			patterns: [
				{
					match: "'{5}(?!')",
					name: 'markup.bold.italic.wikitext',
				},
				{
					match: "'''(?!')",
					name: 'markup.bold.wikitext',
				},
				{
					match: "''(?!')",
					name: 'markup.italic.wikitext',
				},
			],
		},
		externalLink = {
			match: String.raw`(?i)(\[)((?:$1)[^]"<>\[\s]+?)(?=[]"<>\[\s]|'')([^]\n]*)(])`,
			captures: {
				1: linkBracket,
				2: {name: 'entity.name.tag.url.wikitext'},
				3: {
					name: 'string.other.link.external.title.wikitext',
					patterns: [$self],
				},
				4: linkBracket,
			},
		},
		magicLink = {
			patterns: [
				{
					name: 'constant.language.variables.isbn.wikitext',
					match: String.raw`ISBN\s+(?:97[89][-\s]?)?(?:\d[-\s]?){9}[Xx\d]`,
				},
				{
					name: 'constant.language.variables.rfc.wikitext',
					match: String.raw`RFC\s+\d+`,
				},
				{
					name: 'constant.language.variables.pmid.wikitext',
					match: String.raw`PMID\s+\d+`,
				},
			],
		},
		list = {
			name: indent,
			match: '^[#*:;]+',
		},
		convert = {
			begin: String.raw`(-\{)(?!\{)(?:([^]\[{|}]*)(\|))?`,
			end: '(}-)',
			captures: {
				1: {name: 'punctuation.definition.tag.convert.wikitext'},
				2: {
					name: 'entity.name.function.type.wikitext',
					patterns: [
						{
							match: ';',
							name: 'punctuation.terminator.flag.wikitext',
						},
					],
				},
				3: pipeRule,
			},
			patterns: [
				{
					match: String.raw`(?<=[;|]|-\{|=>)\s*($1)(:)(.*?)(?:(;)|(?=}-))`,
					captures: {
						1: {name: 'entity.name.tag.language.wikitext'},
						2: {name: 'punctuation.separator.key-value.wikitext'},
						3: {patterns: [$self]},
						4: {name: 'punctuation.terminator.rule.wikitext'},
					},
				},
				$self,
			],
		};

	return {
		name: 'wikitext',
		scopeName: 'source.wikitext',
		patterns: [
			{include: '#signature'},
			{include: '#redirect'},
			...replaced,
			{include: '#heading'},
			{include: '#comment'},
			{include: 'text.html.basic#tags-valid'},
			{include: '#table'},
			{include: '#behavior-switches'},
			{include: '#break'},
			{include: '#wiki-link'},
			{include: '#font-style'},
			{include: '#external-link'},
			{include: '#magic-link'},
			{include: '#list'},
			{include: '#convert'},
			{include: 'text.html.basic#entities'},
		],
		repository: {
			signature,
			redirect,
			comment,
			wikixml: {
				patterns: [
					{include: '#onlyinclude'},
					{include: '#noinclude'},
					{include: '#self-closed-tags'},
					{include: '#ref'},
					{include: '#json'},
					{include: '#nowiki'},
				],
				repository: {
					onlyinclude,
					noinclude,
					'self-closed-tags': selfClosedTags,
					ref,
					json,
					nowiki,
				},
			},
			argument,
			'magic-words': {
				patterns: [
					{include: '#variables'},
					{include: '#parser-function'},
				],
				repository: {
					variables,
					'parser-function': parserFunction,
				},
			},
			template,
			heading,
			table,
			'behavior-switches': behaviorSwitches,
			break: hr,
			'wiki-link': {
				patterns: [
					{include: '#file-link'},
					{include: '#internal-link'},
				],
				repository: {
					'file-link': fileLink,
					'internal-link': internalLink,
				},
			},
			'font-style': fontStyle,
			'external-link': externalLink,
			'magic-link': magicLink,
			list,
			convert,
		},
	};
})();
