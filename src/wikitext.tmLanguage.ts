import type {IRawGrammar} from '@shikijs/core/textmate';

export type IRawRule = IRawGrammar['repository']['$self'];
declare type IRawCaptures = Exclude<IRawRule['captures'], undefined>;

const extEnd = String.raw`(?i)(</)(\2)\s*(>)`,
	tagBegin = {name: 'punctuation.definition.tag.begin.wikitext'},
	tagEnd = {name: 'punctuation.definition.tag.end.wikitext'},
	tagName = {name: 'entity.name.tag.wikitext'},
	attribute = {include: 'text.html.basic#attribute'},
	linkBracket = {name: 'punctuation.definition.tag.link.internal.wikitext'},
	pageName = {name: 'entity.other.attribute-name.wikitext'},
	invalid = 'invalid.deprecated.ineffective.wikitext',
	$self = {include: '$self'},
	pipe = 'keyword.operator.wikitext',
	tagWithoutAttribute = {
		1: tagBegin,
		2: tagName,
		3: tagEnd,
	};

const tagWithAttribute = (pos = 4): IRawCaptures => ({
		1: tagBegin,
		2: tagName,
		3: {patterns: [attribute]},
		[pos]: tagEnd,
	}),
	extBegin = (exts: string[], suffix = '>'): string => String.raw`(?i)(<)(${exts.join('|')})(\s[^>]*)?(${suffix})`,
	hl = (contentName: string, include: string, lang = contentName): IRawRule => ({
		contentName: `meta.embedded.block.${contentName}`,
		begin: `(?i)(<)(syntaxhighlight|pre)(${
			String.raw`(?:\s[^>]*)?(?:\slang\s*=\s*(?:(['"]?)${lang}\4))(?:\s[^>]*)?`
		})(>)`,
		beginCaptures: tagWithAttribute(5),
		end: extEnd,
		endCaptures: tagWithoutAttribute,
		patterns: [{include}],
	});

const signature = {
		name: 'keyword.other.signature.wikitext',
		match: '~{3,5}',
	},
	redirect = {
		match: String.raw`(?i)^\s*($1)\s*((?::\s*)?\[\[)([^\|\[\]\{\}<>]+)(\|.*?)?(\]\])`,
		captures: {
			1: {name: 'keyword.control.redirect.wikitext'},
			2: linkBracket,
			3: pageName,
			4: {name: invalid},
			5: linkBracket,
		},
	},
	onlyinclude = {
		contentName: 'meta.block.onlyinclude.wikitext',
		begin: '(<)(onlyinclude)(>)',
		end: '(</)(onlyinclude)(>)',
		captures: tagWithoutAttribute,
		patterns: [$self],
	},
	normalWikiTags = {
		patterns: [
			{
				match: String.raw`(?i)(<)(includeonly|noinclude)(\s[^>]*)?(/?>)`,
				captures: tagWithAttribute(),
			},
			{
				match: String.raw`(?i)(</)(includeonly|noinclude)\s*(>)`,
				captures: tagWithoutAttribute,
			},
		],
	},
	wikiSelfClosedTags = {
		match: extBegin(
			['templatestyles', 'ref', 'references', 'nowiki', 'mapframe', 'maplink'],
			'/>',
		),
		captures: tagWithAttribute(),
	},
	ref = {
		contentName: 'meta.block.ref.wikitext',
		begin: extBegin(['ref', 'references', 'inputbox', 'indicator', 'poem', 'gallery']),
		beginCaptures: tagWithAttribute(),
		end: extEnd,
		endCaptures: tagWithoutAttribute,
		patterns: [$self],
	},
	syntaxHighlight = {
		patterns: [
			{include: '#hl-css'},
			{include: '#hl-html'},
			{include: '#hl-js'},
			{include: '#hl-json'},
		],
		repository: {
			'hl-css': hl('css', 'source.css'),
			'hl-html': hl('html', 'text.html.basic'),
			'hl-js': hl('js', 'source.js', '(?:javascript|js)'),
			'hl-json': hl('json', 'source.json'),
		},
	},
	json = {
		contentName: 'meta.embedded.block.json',
		begin: extBegin(['graph', 'templatedata', 'mapframe', 'maplink']),
		beginCaptures: tagWithAttribute(),
		end: extEnd,
		endCaptures: tagWithoutAttribute,
		patterns: [{include: 'source.json'}],
	},
	nowiki = {
		contentName: 'meta.embedded.block.plaintext',
		begin: extBegin(['nowiki', 'pre', 'charinsert', 'imagemap', 'score', 'math', 'chem', 'ce', 'timeline']),
		beginCaptures: tagWithAttribute(),
		end: extEnd,
		endCaptures: tagWithoutAttribute,
	},
	argument = {
		contentName: 'variable.parameter.wikitext',
		begin: String.raw`(\{\{\{)(?!\{)([^\{\}\|]*)`,
		end: String.raw`(\}\}\})`,
		captures: {
			1: {name: 'punctuation.definition.tag.variable.wikitext'},
			2: {name: 'variable.other.wikitext'},
		},
		patterns: [
			{
				begin: String.raw`\|`,
				beginCaptures: {
					0: {name: pipe},
				},
				end: String.raw`(?=\}\}\})`,
				patterns: [
					{
						name: invalid,
						begin: String.raw`\|`,
						end: String.raw`(?=\}\}\})`,
					},
					$self,
				],
			},
		],
	},
	variables = {
		patterns: [
			{
				/** @todo `{{uc:x}}` */
				name: 'constant.language.variables.query.wikitext',
				match: String.raw`(?i)\{\{\s*(?:$1)\s*\}\}`,
			},
			{
				name: 'constant.language.variables.metadata.wikitext',
				match: String.raw`\{\{\s*(?:$1)\s*\}\}`,
			},
		],
	},
	parserFunction = {
		begin: String.raw`(\{\{)\s*(#[^#:\|\[\]\{\}]*[^#:\|\[\]\{\}\s])(:)`,
		end: String.raw`(\}\})`,
		captures: {
			1: {name: 'punctuation.definition.tag.function.wikitext'},
			2: {name: 'entity.name.function.wikitext'},
			3: {name: 'keyword.operator.function.wikitext'},
		},
		patterns: [
			{
				match: String.raw`(\|)`,
				name: pipe,
			},
			$self,
		],
	},
	template = {
		begin: String.raw`(\{\{)([^#:\|\[\]\{\}<>]*(:))?([^#\|\[\]\{\}<>]*)`,
		end: String.raw`(\}\})`,
		captures: {
			1: {name: 'punctuation.definition.tag.template.wikitext'},
			2: {name: 'entity.name.tag.local-name.wikitext'},
			3: {name: 'punctuation.separator.namespace.wikitext'},
			4: {name: 'entity.name.tag.local-name.wikitext'},
		},
		patterns: [
			{
				match: String.raw`(\|)([^\|=\{\}\[\]<>]*[^\|=\{\}\[\]<>\s])\s*(=)`,
				captures: {
					1: {name: pipe},
					2: {name: 'entity.other.attribute-name.local-name.wikitext'},
					3: {name: 'keyword.operator.equal.wikitext'},
				},
			},
			{
				match: String.raw`(\|)`,
				name: pipe,
			},
			$self,
		],
	},
	heading = {
		name: 'markup.heading.wikitext',
		match: String.raw`^(={1,6})(.+)(\1)\s*$`,
		captures: {
			2: {
				name: 'string.quoted.other.heading.wikitext',
				patterns: [$self],
			},
		},
	},
	table = {
		patterns: [
			{
				name: 'meta.tag.block.table.wikitext',
				begin: String.raw`(?<=^\s*(?::+\s*)?)(\{\|)(.*)$`,
				end: String.raw`^\s*(\|\})`,
				captures: {
					1: {name: pipe},
					2: {
						patterns: [
							$self,
							attribute,
						],
					},
				},
				patterns: [
					{
						name: 'meta.tag.block.table-row.wikitext',
						match: String.raw`^\s*(\|-+)(.*)$`,
						captures: {
							1: {name: pipe},
							2: {
								patterns: [
									$self,
									attribute,
								],
							},
						},
					},
					{
						name: 'meta.tag.block.th.heading',
						begin: String.raw`^\s*!`,
						end: '$',
						beginCaptures: {
							0: {name: pipe},
						},
						patterns: [
							{
								name: 'meta.tag.block.th.inline.wikitext',
								match: String.raw`(?:([^\|\[\]\{\}]*)(\|)(?!\|))?(.*?)(!!|\|\||$)`,
								captures: {
									1: {
										patterns: [
											$self,
											attribute,
										],
									},
									2: {name: pipe},
									3: {
										name: 'markup.bold.style.wikitext',
										patterns: [$self],
									},
									4: {name: pipe},
								},
							},
							$self,
						],
					},
					{
						name: 'meta.tag.block.td.wikitext',
						begin: String.raw`^\s*\|\+?`,
						end: '$',
						beginCaptures: {
							0: {name: pipe},
						},
						patterns: [
							{
								name: 'meta.tag.block.td.inline.wikitext',
								match: String.raw`(?:([^\|\[\]\{\}]*)(\|)(?!\|))?(.*?)(\|\||$)`,
								captures: {
									1: {
										patterns: [
											$self,
											attribute,
										],
									},
									2: {name: pipe},
									3: {
										name: 'markup.style.wikitext',
										patterns: [$self],
									},
									4: {name: pipe},
								},
							},
							$self,
						],
					},
					$self,
				],
			},
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
		name: 'string.quoted.internal-link.wikitext',
		begin: String.raw`(?i)(\[\[)[^\S\n]*(${
			String.raw`(?:$1)[^\S\n]*:`
		})[^\S\n]*([^\n\|\[\]\{\}<>#]*)(#[^\n\|\[\]\{\}]*)?`,
		end: String.raw`(\]\])`,
		captures: {
			1: linkBracket,
			2: {name: 'entity.name.tag.namespace.wikitext'},
			3: pageName,
			4: {name: invalid},
		},
		patterns: [
			{
				match: String.raw`(\|)([\w\s]*\w=)?`,
				captures: {
					1: {name: pipe},
					2: {name: 'entity.other.attribute-name.localname.wikitext'},
				},
			},
			$self,
		],
	},
	internalLink = {
		name: 'string.quoted.internal-link.wikitext',
		begin: String.raw`(\[\[)((?:[^#:\n\|\[\]\{\}<>]*:){1,2})?([^\n\|\[\]\{\}<>]*)`,
		end: String.raw`(\]\])`,
		captures: {
			1: linkBracket,
			2: {name: 'entity.name.tag.namespace.wikitext'},
			3: pageName,
		},
		patterns: [
			{
				begin: String.raw`\|`,
				end: String.raw`(?=\]\])`,
				captures: {
					0: {name: pipe},
				},
				patterns: [$self],
			},
			$self,
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
		match: String.raw`(\[)((?:$1)[^\[\]<>"\s]*)(?=[\[\]<>"\s])([^\]\n]*)(\])`,
		captures: {
			1: {name: 'punctuation.definition.tag.link.external.wikitext'},
			2: {name: 'entity.name.tag.url.wikitext'},
			3: {
				name: 'string.other.link.external.title.wikitext',
				patterns: [$self],
			},
			4: {name: 'punctuation.definition.tag.link.external.wikitext'},
		},
	},
	magicLink = {
		patterns: [
			{
				name: 'constant.language.variables.isbn.wikitext',
				match: String.raw`ISBN\s+(?:97[89][\-\s]?)?(?:\d[\-\s]?){9}[\dXx]`,
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
		name: 'punctuation.definition.list.begin.markdown.wikitext',
		match: '^[#*;:]+',
	},
	convert = {
		begin: String.raw`(-\{)(?!\{)(?:([^\|\{\}\[\]]*)(\|))?`,
		end: String.raw`(\}-)`,
		captures: {
			1: {name: 'punctuation.definition.tag.template.wikitext'},
			2: {
				name: 'entity.name.function.type.wikitext',
				patterns: [
					{
						match: ';',
						name: 'punctuation.terminator.flag.wikitext',
					},
				],
			},
			3: {name: pipe},
		},
		patterns: [
			{
				match: String.raw`(?<=(?:[|;]|-\{|=>)\s*)([a-z\-]+)(:)(.*?)(?:(;)|(?=\}-))`,
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

/**
 * @author Rowe Wilson Frederisk Holme
 * @author Bhsd
 * @license MIT
 * @see https://github.com/Frederisk/Wikitext-VSCode-Extension/blob/master/syntaxes/wikitext.tmLanguage.yaml
 */
export default {
	name: 'wikitext',
	scopeName: 'source.wikitext',
	patterns: [
		{include: '#signature'},
		{include: '#redirect'},
		{include: '#wikixml'},
		{include: '#argument'},
		{include: '#magic-words'},
		{include: '#template'},
		{include: '#heading'},
		{include: 'text.html.basic'},
		{include: '#table'},
		{include: '#behavior-switches'},
		{include: '#break'},
		{include: '#wiki-link'},
		{include: '#font-style'},
		{include: '#external-link'},
		{include: '#magic-link'},
		{include: '#list'},
		{include: '#convert'},
	],
	repository: {
		signature,
		redirect,
		wikixml: {
			patterns: [
				{include: '#onlyinclude'},
				{include: '#normal-wiki-tags'},
				{include: '#wiki-self-closed-tags'},
				{include: '#ref'},
				{include: '#syntax-highlight'},
				{include: '#json'},
				{include: '#nowiki'},
			],
			repository: {
				onlyinclude,
				'normal-wiki-tags': normalWikiTags,
				'wiki-self-closed-tags': wikiSelfClosedTags,
				ref,
				'syntax-highlight': syntaxHighlight,
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
