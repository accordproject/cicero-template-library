'use strict';
const path = require('path');
const { defineConfig } = require('vitest/config');
module.exports = defineConfig({
    resolve: {
        alias: {
            // concerto-core 5.0.0's ESM build reports its version as
            // 5.0.0-beta.2, so it rejects models#200's `concerto version
            // "^5.0.0"` pragma; its CommonJS build reports 5.0.0 and accepts
            // it. Load the CommonJS build, as Node's require() does.
            '@accordproject/concerto-core': require.resolve('@accordproject/concerto-core'),
        },
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['logic/**/*.test.ts', 'composed/**/*.test.ts', 'test/**/*.test.ts'],
        setupFiles: [path.join(__dirname, '../test-setup.js')],
    },
});
