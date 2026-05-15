import { Template } from '@accordproject/cicero-core';
import { TemplateArchiveProcessor } from '@accordproject/template-engine';
import { describe, it, expect } from 'vitest';
import { readdirSync, existsSync, readFileSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const templates = readdirSync(SRC).filter(name => {
    const p = join(SRC, name);
    return statSync(p).isDirectory() && existsSync(join(p, 'package.json'));
});

describe.concurrent('template-engine render', () => {
    for (const name of templates) {
        it(name, async () => {
            const templatePath = join(SRC, name);
            const template = await Template.fromDirectory(templatePath);
            const proc = new TemplateArchiveProcessor(template);

            // Prefer the committed sample.json when its $class still matches
            // the current TemplateModel; otherwise synthesise sample data so
            // every template exercises the render pipeline.
            const tmFqn = template.getTemplateModel().getFullyQualifiedName();
            const sampleJsonPath = join(templatePath, 'sample.json');
            let data;
            if (existsSync(sampleJsonPath)) {
                const candidate = JSON.parse(readFileSync(sampleJsonPath, 'utf8'));
                if (candidate.$class === tmFqn) data = candidate;
            }
            if (!data) {
                const cd = template.getTemplateModel();
                const obj = template.getFactory().newResource(cd.getNamespace(), cd.getName(), 'sample-id', { generate: true, includeOptionalFields: true });
                data = template.getSerializer().toJSON(obj);
            }

            const out = await proc.draft(data, 'markdown', {});
            expect(typeof out).toBe('string');
            expect(out.length).toBeGreaterThan(0);
        }, 30_000);
    }
});
