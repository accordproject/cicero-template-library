# Exit on first error, print all commands.
set -ev
date
for d in ./*/ ; do (cd "$d" && npm install && npm test); done