#!/bin/bash

set -EeuoT pipefail

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

README_FILE="${SCRIPT_DIR}/../README.md"
INDEX_TS="${SCRIPT_DIR}/readme_test_template/src/index.ts"

mkdir -p "$( dirname "${INDEX_TS}" )"
cat "${README_FILE}" | sed 's/^```typescript$/```typescript\n/g' | sed -n '/```typescript$/,/```/{//!p}' > "${INDEX_TS}".tmp

# add imports first, then the rest between 'export const run = async () => {}' and '};'

(
    cat "${INDEX_TS}".tmp | grep "^import "
    echo
    echo "export const run = async () => {"
    cat "${INDEX_TS}".tmp | grep -v "^import "
    echo
    echo "};"
) > "${INDEX_TS}"

rm "${INDEX_TS}".tmp
