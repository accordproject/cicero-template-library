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

// Archived templates (package.json `"archived": true`) are retired and no
// longer expected to compile, render, or trigger. 
const archivedTemplates = templates.filter(name => {
    const packageJson = JSON.parse(readFileSync(join(SRC, name, 'package.json'), 'utf8'));
    return packageJson.archived === true;
});
if (archivedTemplates.length) {
    console.log(`\nSkipping ${archivedTemplates.length} archived template(s): ${archivedTemplates.join(', ')}\n`);
    const archivedSet = new Set(archivedTemplates);
    templates = templates.filter(name => !archivedSet.has(name));
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
//
// copyright-license-agreement-poc is a prototype migration onto the model
// design proposed in accordproject/models#200 ("Agreement 1.0 Model
// Redesign" — itself explicitly "a design target, not migration-ready").
// Its @template-decorated class composes its variables onto a shared
// AgreementDocument envelope (`extends AgreementDocument {}`, zero own
// properties) rather than declaring them directly. TemplateMark's
// WithDefinition/ClauseDefinition resolution (markdown-template's
// TypeVisitor) looks properties up via ClassDeclaration#getOwnProperty,
// which only inspects properties declared directly on that class and does
// not walk the supertype chain — so no field reachable only through
// inheritance or composition can be grammar-rendered today. Compilation,
// sample.json round-tripping, and trigger() logic all pass; see
// src/copyright-license-agreement-poc/README.md.
//

const expectedFailures = new Set([
    'bill-of-lading',
    'copyright-license-agreement-poc',
    'fixed-interests',
    'supply-agreement-loc',
    'volumediscountolist',
    'volumediscountulist',
]);

// Only templates with compiled logic can be triggered/initialized.
const hasLogic = (templatePath) => existsSync(join(templatePath, 'logic', 'logic.ts'));

const getData = (templatePath, name) => {
    const sampleJsonPath = join(templatePath, 'sample.json');
    expect(existsSync(sampleJsonPath), `${name}: sample.json is missing`).toBe(true);
    return JSON.parse(readFileSync(sampleJsonPath, 'utf8'));
};

const getRequest = (templatePath) => {
    const requestJsonPath = join(templatePath, 'request.json');
    return existsSync(requestJsonPath)
        ? JSON.parse(readFileSync(requestJsonPath, 'utf8'))
        : {};
};

// Precompute per-template metadata once so every describe block below can
// filter without re-reading package.json from disk repeatedly.
const templateInfo = templates.map(name => {
    const templatePath = join(SRC, name);
    return {
        name,
        path: templatePath,
        hasLogic: hasLogic(templatePath),
    };
});

const logicTemplates = templateInfo.filter(t => t.hasLogic);
const templateCache = new Map();
const getTemplate = (templatePath) => {
    if (!templateCache.has(templatePath)) {
        templateCache.set(templatePath, Template.fromDirectory(templatePath, { offline: true }));
    }
    return templateCache.get(templatePath);
};
const isStatefulTemplate = (template) => template.isStateful();
const statefulLogicTemplateNames = new Set(
    (await Promise.all(logicTemplates.map(async ({ name, path: templatePath }) => {
        const template = await getTemplate(templatePath);
        return isStatefulTemplate(template) ? name : null;
    }))).filter(Boolean),
);
const statefulLogicTemplates = logicTemplates.filter(t => statefulLogicTemplateNames.has(t.name));

// Compilation

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

// Draft rendering

describe('template-engine render', () => {
    for (const name of templates) {
        const test = expectedFailures.has(name) ? it.fails : it;
        test(name, async () => {
            const templatePath = join(SRC, name);
            const template = await getTemplate(templatePath);
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

// Stateful
describe.concurrent('template-engine init', () => {
    for (const { name, path: templatePath } of statefulLogicTemplates) {
        it(name, async () => {
            const template = await getTemplate(templatePath);
            const proc = new TemplateArchiveProcessor(template);
            const data = getData(templatePath, name);

            const response = await proc.init(data);

            expect(response).toBeDefined();
            expect(typeof response).toBe('object');
            expect(response.state).toBeDefined();
        }, 30_000);
    }
});

describe.concurrent('template-engine trigger', () => {
    for (const { name, path: templatePath } of logicTemplates) {
        it(name, async () => {
            const template = await getTemplate(templatePath);
            const proc = new TemplateArchiveProcessor(template);
            const data = getData(templatePath, name);
            const request = getRequest(templatePath);

            if (statefulLogicTemplateNames.has(name)) {
                // Stateful templates should only execute the stateful path.
                const { state } = await proc.init(data);
                const response = await proc.trigger(data, request, state);

                expect(response).toBeDefined();
                expect(response.result).toBeDefined();
                expect(response.state).toBeDefined();
                expect(Array.isArray(response.events)).toBe(true);
                return;
            }

            // Stateless templates should only execute the stateless path.
            const response = await proc.trigger(data, request);

            expect(response).toBeDefined();
            expect(response.result).toBeDefined();
            expect(response.state).toBeUndefined();
            // events may or may not be present
            if (response.events !== undefined) {
                expect(Array.isArray(response.events)).toBe(true);
            }
        }, 30_000);
    }
});
