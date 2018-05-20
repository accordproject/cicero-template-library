# Exit on first error, print all commands.
set -ev
date

for template in $(find ./* -maxdepth 0 -type d );
do
  echo "$template"
  cd "$template"
  npm install
  ./node_modules/.bin/cicero parse --out contract.json
  npm test
  cd ..
done