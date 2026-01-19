#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "No tag provided. using latest"
  publish_tag="latest"
else
  publish_tag=$1
fi

echo "Publishing with tag: $publish_tag"

version=$(cat package.json | jq -r '.version')
if ! yarn npm info tsnv@$version --fields version --json | jq -r '.version' | grep -q $version; then
  yarn workspace tsnv pack --out package.tgz
  npm publish package.tgz --tag $publish_tag --provenance
else
  echo "tsnv@$version is already published"
fi
