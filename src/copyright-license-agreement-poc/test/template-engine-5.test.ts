// Renders this prototype's archives with @accordproject/template-engine
// 5.1, installed for this workspace only (the rest of the repo is still on
// 4.0.0). 5.x lets a caller name the template's root concept instead of
// finding it by the @template decorator, and formats money@1.0.0
// PreciseAmount natively. cicero-core's Template still requires the
// decorator (template-archive#946), so these tests drive the engine's
// interpreter directly rather than through a loaded Template.
//
// The logic is not compiled with the engine: 5.1 compiles logic against
// runtime@0.2.0 and a `TemplateLogic` class, not the runtime@1.0.0 bases
// and `defineLogic` API this prototype proposes (see the README).
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import {
    ModelManager,
    TemplateMarkInterpreter,
    TemplateMarkTransformer,
} from '@accordproject/template-engine';

const TEMPLATE_DIR = join(__dirname, '..');
const LICENCE = { dir: '.', root: 'poc.accordproject.copyrightlicense@0.1.0.CopyrightLicenseData' };
const LATE_PAYMENT = { dir: 'composed/late-payment', root: 'poc.accordproject.latepayment@0.1.0.LatePaymentData' };
const SCHEDULE = { dir: 'documents/licensed-work-schedule', root: 'poc.accordproject.licensedwork@0.1.0.LicensedWorkSchedule' };

const read = (...path: string[]) => readFileSync(join(TEMPLATE_DIR, ...path), 'utf8');

// The licence's own models (including the vendored base namespaces) plus
// those of any other archives named, loaded into one model manager: the
// composite loading a parent with composed clauses needs.
function loadModels(...archiveDirs: string[]) {
    const modelManager = new ModelManager();
    for (const dir of new Set(['.', ...archiveDirs])) {
        for (const file of readdirSync(join(TEMPLATE_DIR, dir, 'model'))) {
            modelManager.addCTOModel(read(dir, 'model', file), join(dir, file), true);
        }
    }
    modelManager.validateModelFiles();
    return modelManager;
}

function plainText(ciceroMark: any): string {
    const parts: string[] = [];
    JSON.stringify(ciceroMark, (_key, node) => {
        if (node && typeof node === 'object') {
            if (typeof node.text === 'string') {
                parts.push(node.text);
            } else if (typeof node.value === 'string' && /(Variable|Formula)$/.test(node.$class)) {
                parts.push(node.value);
            }
        }
        return node;
    });
    return parts.join('');
}

async function render(archive: { dir: string; root: string }) {
    const modelManager = loadModels(archive.dir);
    const templateMark = new TemplateMarkTransformer().fromMarkdownTemplate(
        { content: read(archive.dir, 'text', 'grammar.tem.md') }, modelManager, 'contract', { verbose: false }, archive.root);
    const ciceroMark = await new TemplateMarkInterpreter(modelManager, {}, archive.root)
        .generate(templateMark, JSON.parse(read(archive.dir, 'sample.json')), { now: '2026-10-01T00:00:00.000Z' });
    return plainText(ciceroMark.toJSON());
}

describe('template-engine 5.1', () => {
    it('renders the licence with the root concept named explicitly, no @template decorator', async () => {
        const text = await render(LICENCE);

        expect(text).toContain('made by and between Me ("Licensee") and Myself ("Licensor")');
        // {{amount}} is a money@1.0.0 PreciseAmount, drafted natively by 5.1.
        expect(text).toContain('a one-time fee in the amount of one hundred US Dollars (100.00 USD)');
        expect(text).not.toContain('{{');
    });

    it('renders the composed late payment clause and the schedule, each as a template in its own right', async () => {
        expect(await render(LATE_PAYMENT)).toContain('within 14 days of it falling due');
        expect(await render(SCHEDULE)).toContain('Format: Digital photographs, JPEG');
    });
});
