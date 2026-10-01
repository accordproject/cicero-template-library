'use strict';
const path = require('path');
const { defineConfig } = require('vitest/config');
module.exports = defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['logic/**/*.test.ts', 'test/**/*.test.ts'],
        setupFiles: [path.join(__dirname, '../test-setup.js')],
    },
});
