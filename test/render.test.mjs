import { Template } from '@accordproject/cicero-core';
import { TemplateArchiveProcessor } from '@accordproject/template-engine';
import { describe, it, expect } from 'vitest';
import { readdirSync, existsSync, readFileSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
let templates = readdirSync(SRC).filter(name => {
    const p = join(SRC, name);
    return statSync(p).isDirectory() && existsSync(join(p, 'package.json'));
});

// Allow filtering templates via TEMPLATES env var (comma-separated)
// Usage: TEMPLATES=acceptance-of-delivery,fragile-goods npm run test:render
if (process.env.TEMPLATES) {
    const filter = new Set(process.env.TEMPLATES.split(',').map(t => t.trim()));
    templates = templates.filter(name => filter.has(name));
    console.log(`\nFiltering to ${templates.length} template(s): ${templates.join(', ')}\n`);
}

// Templates with known upstream @accordproject/template-engine bugs or
// pre-existing sample.json data-shape issues left over from the cicero
// 0.26 migration. it.fails marks them as expected-to-fail: the suite
// stays green while they fail, but will turn red once the issue is
// resolved so we know to remove the entry.
//
// Upstream bug references:
//   bill-of-lading            — markdown-transform#673
//   fixed-interests           — template-engine#147
//   supply-agreement-loc      — template-engine#146
//   volumediscountolist       — template-engine#145
//   volumediscountulist       — template-engine#145
const expectedFailures = new Set([
    'bill-of-lading',
    'car-rental-tr',
    'company-information',
    'docusign-po-failure',
    'fixed-interests',
    'fragile-goods',
    'full-payment-upon-demand',
    'installment-sale',
    'interest-rate-swap',
    'latedeliveryandpenalty-optional',
    'perishable-goods',
    'project-information',
    'rental-deposit',
    'rental-deposit-with',
    'roommate',
    'saft',
    'servicelevelagreement',
    'supply-agreement-loc',
    'volumediscountolist',
    'volumediscountulist',
]);

// Templates with TypeScript type errors in their logic.ts files.
// These are pre-existing issues that should be fixed separately.
// Most relate to the MonetaryAmount migration where IMonetaryAmount
// (an object with doubleValue/currencyCode) replaced plain numbers.
const typeCheckingFailures = new Set([
    'supplyagreement',
    'supplyagreement-perishable-goods',
    'volumediscount',
    'volumediscountolist',
    'volumediscountulist',
]);

describe('template compilation', () => {
    for (const name of templates) {
        // Compilation tests should not be expected to fail — compilation errors are
        // critical and should be caught immediately
        it(name, () => {
            const templatePath = join(SRC, name);
            const packageJsonPath = join(templatePath, 'package.json');
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

            // Only test templates that have a compile script
            if (!packageJson.scripts?.compile) {
                return;
            }

            try {
                // Run npm compile from the template directory
                execSync('npm run compile', {
                    cwd: templatePath,
                    stdio: 'pipe',
                });
            } catch (error) {
                throw new Error(`${name}: template compilation failed: ${error.message}`);
            }
        });
    }
});

describe('template TypeScript type checking', () => {
    for (const name of templates) {
        const test = typeCheckingFailures.has(name) ? it.fails : it;
        test(name, () => {
            const templatePath = join(SRC, name);
            const logicDir = join(templatePath, 'logic');

            // Only type-check templates with TypeScript logic files
            if (!existsSync(logicDir)) {
                return;
            }

            const tsFiles = readdirSync(logicDir).filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));
            if (tsFiles.length === 0) {
                return;
            }

            try {
                // Run tsc --noEmit on the logic directory to catch type errors
                // without emitting JavaScript files
                const files = tsFiles.map(f => join(logicDir, f)).join(' ');
                execSync(`npx tsc --noEmit --skipLibCheck --moduleResolution node ${files}`, {
                    cwd: templatePath,
                    stdio: 'pipe',
                    encoding: 'utf8',
                });
            } catch (error) {
                // Capture stderr which contains the actual type errors
                const output = error.stderr || error.stdout || error.message;
                throw new Error(`${name}: TypeScript type errors:\n${output}`);
            }
        });
    }
});

describe.concurrent('template-engine render', () => {
    for (const name of templates) {
        const test = expectedFailures.has(name) ? it.fails : it;
        test(name, async () => {
            const templatePath = join(SRC, name);
            const template = await Template.fromDirectory(templatePath);
            const proc = new TemplateArchiveProcessor(template);

            // sample.json must be present and must round-trip through the
            // template's serializer. The serializer walks every nested
            // resource and validates each $class against the ModelManager,
            // so stale namespaces — including ones buried inside nested
            // objects — fail loud here rather than slipping through to
            // template-engine rendering with a generic error.
            const tmFqn = template.getTemplateModel().getFullyQualifiedName();
            const sampleJsonPath = join(templatePath, 'sample.json');
            expect(existsSync(sampleJsonPath), `${name}: sample.json is missing`).toBe(true);
            const data = JSON.parse(readFileSync(sampleJsonPath, 'utf8'));
            expect(data.$class, `${name}: sample.json $class does not match TemplateModel`).toBe(tmFqn);
            expect(
                () => template.getSerializer().fromJSON(data),
                `${name}: sample.json does not deserialize against the template model`,
            ).not.toThrow();

            const out = await proc.draft(data, 'markdown', {});
            expect(typeof out).toBe('string');
            expect(out.length).toBeGreaterThan(0);
        }, 30_000);
    }
});
