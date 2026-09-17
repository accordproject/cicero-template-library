import { Clause, Template } from '@accordproject/cicero-core';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EVIDENCE_DIR = join(ROOT, 'src', 'copyright-license-agreement-poc', 'evidence');

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const templateReference = (template) => ({
    $class: 'org.accordproject.template@1.0.0.TemplateReference',
    templateId: template.getName(),
    version: template.getVersion(),
    archiveHash: {
        $class: 'org.accordproject.crypto@1.0.0.ContentHash',
        algorithm: {
            $class: 'org.accordproject.crypto@1.0.0.HashAlgorithm',
            type: 'SHA_256',
        },
        value: template.getHash(),
        encoding: 'HEX',
    },
});

describe('models#200 composed-template provenance evidence', () => {
    it('binds a separately loaded child template archive to the parent clause path', async () => {
        const binding = readJson(join(EVIDENCE_DIR, 'composition-binding.json'));
        const parentPath = resolve(EVIDENCE_DIR, binding.parentTemplate);
        const childBinding = binding.clauses.paymentClause;
        const childPath = resolve(EVIDENCE_DIR, childBinding.template);

        const parentSource = await Template.fromDirectory(parentPath, { offline: true });
        const childSource = await Template.fromDirectory(childPath, { offline: true });
        const [parentArchive, childArchive] = await Promise.all([
            parentSource.toArchive('typescript'),
            childSource.toArchive('typescript'),
        ]);
        const [parentTemplate, childTemplate] = await Promise.all([
            Template.fromArchive(parentArchive, { offline: true }),
            Template.fromArchive(childArchive, { offline: true }),
        ]);

        expect(parentTemplate.getName()).toBe('copyright-license');
        expect(childTemplate.getName()).toBe('payment-upon-signature');
        expect(parentTemplate.getIdentifier()).not.toBe(childTemplate.getIdentifier());
        expect(parentTemplate.getHash()).not.toBe(childTemplate.getHash());
        expect(Buffer.compare(parentArchive, childArchive)).not.toBe(0);

        const childClause = new Clause(childTemplate);
        childClause.setData(readJson(join(childPath, 'sample.json')));
        expect(childClause.toJSON().template).toBe(childTemplate.getIdentifier());

        const document = {
            $class: 'org.accordproject.agreement@1.0.0.AgreementDocument',
            documentId: binding.documentId,
            template: templateReference(parentTemplate),
            data: readJson(join(parentPath, 'sample.json')),
            clauses: {
                paymentClause: {
                    $class: 'org.accordproject.agreement@1.0.0.Clause',
                    template: templateReference(childTemplate),
                    clauseId: childBinding.clauseId,
                },
            },
        };

        expect(parentTemplate.getTemplate()).toContain('{{#clause paymentClause}}');
        expect(parentTemplate.getTemplate()).not.toContain(childTemplate.getTemplate().trim());
        expect(document.template.templateId).toBe('copyright-license');
        expect(document.clauses.paymentClause.template.templateId).toBe('payment-upon-signature');
        expect(document.clauses.paymentClause.template.archiveHash.value).toBe(childTemplate.getHash());
        expect(document.clauses.paymentClause.template.archiveHash.value)
            .not.toBe(document.template.archiveHash.value);
        expect(Object.keys(document.clauses)).toEqual(['paymentClause']);
        expect(Object.keys(document.clauses).some(path => path.startsWith('data.'))).toBe(false);
    }, 30_000);

    it('keeps provenance absent when the parent clause block is inline-only', async () => {
        const binding = readJson(join(EVIDENCE_DIR, 'composition-binding.json'));
        const parentPath = resolve(EVIDENCE_DIR, binding.parentTemplate);
        const parentTemplate = await Template.fromDirectory(parentPath, { offline: true });
        const inlineOnlyDocument = {
            $class: 'org.accordproject.agreement@1.0.0.AgreementDocument',
            documentId: 'copyright-license-doc-inline-001',
            template: templateReference(parentTemplate),
            data: readJson(join(parentPath, 'sample.json')),
        };

        expect(parentTemplate.getTemplate()).toContain('{{#clause paymentClause}}');
        expect(inlineOnlyDocument.data.paymentClause).toBeDefined();
        expect(inlineOnlyDocument.clauses).toBeUndefined();
    });
});
