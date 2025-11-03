#!/usr/local/bin/bash
if [[ $2 == 'npm' ]]
then
	npm publish --tag "${3-latest}"
elif [[ $2 == 'gh' ]]
then
	gsed -n "/## v$1/,/##/{/^## .*/d;/./,\$!d;p}" CHANGELOG.md > release-notes.md
	gh release create "$1" --notes-file release-notes.md -t "v$1" --verify-tag --latest="${3-true}"
	rm release-notes.md
else
	npm run lint && npm run build:test && npm run test:real && npm run build && npm run build:gh-page
	if [[ $? -eq 0 ]]
	then
		sed -i '' -E "s/\"version\": \".+\"/\"version\": \"$1\"/" package.json
		git add -A
		git commit -m "chore: bump version to $1"
		git push
		git tag "$1"
		git push origin "$1"
	fi
fi
