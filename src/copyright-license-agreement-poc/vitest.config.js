'use strict';
// DRAFT for the next major release. '@accordproject/template-engine' is the
// draft pre-release major, which is not published: it is aliased to a
// checkout of the next-major engine, ACCORD_NEXT_ENGINE (default below), with
// its `factories` module, which the generated types in logic/generated use.
// Run with that checkout's vitest: this repository does not install it.
//
// The tests live in test/, not logic/: the engine's template hash covers
// every logic/*.ts file, and tests ride outside the hash.
const path = require('node:path');

const engineRoot = process.env.ACCORD_NEXT_ENGINE
    || '/Users/matt/dev/sbx/bank-product-template-poc/.claude/worktrees/next-major';
const engine = (file) => path.join(engineRoot, 'src/engine', file);

module.exports = {
    resolve: {
        alias: [
            { find: /^@accordproject\/template-engine$/, replacement: engine('index.ts') },
            { find: /^@accordproject\/template-engine\/factories$/, replacement: engine('factories.ts') },
        ],
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['test/**/*.test.ts'],
        testTimeout: 60000,
    },
};
