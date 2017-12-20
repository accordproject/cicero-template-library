# Exit on first error, print all commands.
set -ev
date

for template in $(find ./* -maxdepth 0 -type d );
do
  echo "$template"
  cd "$template"
  npm install
  npm test
  cd ..
done