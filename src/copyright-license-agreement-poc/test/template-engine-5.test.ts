// Runs this template through @accordproject/template-engine 5.1, installed
// for this workspace only (the rest of the repo is still on 4.0.0). 5.x
// lets a caller name the template's root concept instead of finding it by
// the @template decorator, and formats money@1.0.0 PreciseAmount natively.
// cicero-core's Template still requires the decorator (template-archive#946)
// and only recognises runtime@0.2.0.State as state, so these tests drive
// the engine's interpreter and compiler directly rather than through a
// loaded Template.
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import {
    ModelManager,
    TemplateMarkInterpreter,
    TemplateMarkTransformer,
} from '@accordproject/template-engine';
import { TypeScriptToJavaScriptCompiler } from '@accordproject/template-engine/lib/TypeScriptToJavaScriptCompiler';

const TEMPLATE_DIR = join(__dirname, '..');
const TEMPLATE_ROOT = 'poc.accordproject.copyrightlicense@0.1.0.CopyrightLicenseData';

const read = (...path: string[]) => readFileSync(join(TEMPLATE_DIR, ...path), 'utf8');

function loadModels() {
    const modelManager = new ModelManager();
    for (const file of readdirSync(join(TEMPLATE_DIR, 'model'))) {
        modelManager.addCTOModel(read('model', file), file, true);
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

describe('template-engine 5.1', () => {
    it('renders the sample with the root concept named explicitly, no @template decorator', async () => {
        const modelManager = loadModels();
        const templateMark = new TemplateMarkTransformer().fromMarkdownTemplate(
            { content: read('text', 'grammar.tem.md') }, modelManager, 'contract', { verbose: false }, TEMPLATE_ROOT);

        const ciceroMark = await new TemplateMarkInterpreter(modelManager, {}, TEMPLATE_ROOT)
            .generate(templateMark, JSON.parse(read('sample.json')), { now: '2026-10-01T00:00:00.000Z' });
        const text = plainText(ciceroMark.toJSON());

        expect(text).toContain('made by and between Me ("Licensee") and Myself ("Licensor")');
        // {{amount}} is a money@1.0.0 PreciseAmount, drafted natively by 5.1.
        expect(text).toContain('a one-time fee in the amount of one hundred US Dollars (100.00 USD)');
        expect(text).not.toContain('{{');
    });

    it('type-checks logic.ts against the runtime declarations it injects', async () => {
        const compiler = new TypeScriptToJavaScriptCompiler(loadModels(), TEMPLATE_ROOT);
        await compiler.initialize();

        const result = compiler.compile(read('logic', 'logic.ts'));

        expect(result.errors.map((e: any) => e.renderedMessage)).toEqual([]);
    });
});
