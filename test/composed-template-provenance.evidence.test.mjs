import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EVIDENCE_DIR = join(ROOT, 'src', 'copyright-license-agreement-poc', 'evidence');
const COPYRIGHT_LICENSE_SAMPLE = join(ROOT, 'src', 'copyright-license', 'sample.json');

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

describe('models#200 composed-template provenance evidence', () => {
    it('captures composed-template provenance in AgreementDocument.clauses', () => {
        const composedDoc = readJson(join(EVIDENCE_DIR, 'composed-agreement-document.json'));

        expect(composedDoc.$class).toBe('org.accordproject.agreement@1.0.0.AgreementDocument');
        expect(composedDoc.clauses).toBeDefined();

        const clausePaths = Object.keys(composedDoc.clauses);
        expect(clausePaths).toContain('paymentTerms');
        expect(clausePaths.some(path => path.startsWith('data.'))).toBe(false);

        const paymentTermsProvenance = composedDoc.clauses.paymentTerms;
        expect(paymentTermsProvenance.template.templateId).toBe('org.accordproject.paymentterms@0.1.0');
        expect(paymentTermsProvenance.template.version).toBe('0.1.0');
        expect(paymentTermsProvenance.clauseId).toBe('payment-terms-clause-001');
    });

    it('shows inline-only clause usage has no AgreementDocument.clauses provenance map', () => {
        const inlineDoc = readJson(join(EVIDENCE_DIR, 'inline-only-agreement-document.json'));

        expect(inlineDoc.$class).toBe('org.accordproject.agreement@1.0.0.AgreementDocument');
        expect(inlineDoc.clauses).toBeUndefined();
        expect(inlineDoc.data.paymentTerms).toBeDefined();
    });

    it('anchors the inline-only baseline to the existing copyright-license template sample', () => {
        const inlineSample = readJson(COPYRIGHT_LICENSE_SAMPLE);

        expect(inlineSample.paymentClause).toBeDefined();
        expect(inlineSample.paymentClause.$class).toBe('org.accordproject.copyrightlicense@0.2.0.PaymentClause');
        expect(inlineSample.clauses).toBeUndefined();
    });
});
