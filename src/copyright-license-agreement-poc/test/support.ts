// Fixtures shared by this workspace's tests.
import { createHash } from 'crypto';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Template } from '@accordproject/cicero-core';
import { AgreementProcessor } from '@accordproject/template-engine';
import { ContentHash, HashAlgorithm, PreciseAmount, TemplateReference, Unit } from '../logic/generated/types';
import { HashAlgorithmType, HashEncoding } from '../logic/generated/org.accordproject.crypto@1.0.0';

export const ROOT = join(__dirname, '..');

/** The templates an agreement of a licence is made of, by templateId (each one's package name). */
export const TEMPLATES = {
    'copyright-license-agreement-poc': '.',
    'late-payment-poc': '../late-payment-poc',
    'licensed-work-schedule-poc': '../licensed-work-schedule-poc',
} as const;

export type TemplateId = keyof typeof TEMPLATES;

export const read = (...path: string[]) => readFileSync(join(ROOT, ...path), 'utf8');
export const sample = (templateId: TemplateId) => JSON.parse(read(TEMPLATES[templateId], 'sample.json'));

/** A template, loaded as the engine loads it. */
export const loadTemplate = (templateId: TemplateId): Promise<Template> =>
    Template.fromDirectory(join(ROOT, TEMPLATES[templateId]), { offline: true });

/** This template's models, which include the late payment clause's and the schedule's. */
export const loadModels = async () => (await loadTemplate('copyright-license-agreement-poc')).getModelManager();

/** An engine for agreements of these templates. */
export const loadAgreementProcessor = async () =>
    new AgreementProcessor(await Promise.all((Object.keys(TEMPLATES) as TemplateId[]).map(loadTemplate)));

/** A template@1.0.0 TemplateReference, hashing the template's model, text and logic as a stand-in for its archive hash. */
export function templateReference(templateId: TemplateId) {
    const dir = TEMPLATES[templateId];
    const hash = createHash('sha256');
    for (const part of ['model', 'text', 'logic']) {
        let files: string[] = [];
        try {
            files = readdirSync(join(ROOT, dir, part)).filter(f => f.includes('.')).sort();
        } catch {
            // A stateless template has no logic.
        }
        for (const file of files) {
            hash.update(`${part}/${file}\n`).update(read(dir, part, file));
        }
    }
    return TemplateReference.create({
        templateId,
        version: '0.1.0',
        archiveHash: ContentHash.create({
            algorithm: HashAlgorithm.create({ type: HashAlgorithmType.SHA_256 }),
            value: hash.digest('hex'),
            encoding: HashEncoding.HEX,
        }),
    });
}

export const amount = (unscaledValue: string, code = 'USD', scale = 2) =>
    PreciseAmount.create({ unscaledValue, unit: Unit.create({ code, scheme: 'iso4217', scale }) });

/** An ISO timestamp `seconds` after midnight on 2 January 2018. */
export const at = (seconds: number) => new Date(Date.UTC(2018, 0, 2, 0, 0, seconds)).toISOString();
