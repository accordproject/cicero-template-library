// Fixtures shared by this workspace's tests.
import { createHash } from 'crypto';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { ModelManager } from '@accordproject/concerto-core';
import { ContentHash, HashAlgorithm, PreciseAmount, TemplateReference, Unit } from '../logic/generated/types';
import { HashAlgorithmType, HashEncoding } from '../logic/generated/org.accordproject.crypto@1.0.0';

export const ROOT = join(__dirname, '..');

/** Each archive in this prototype, by templateId. */
export const ARCHIVES = {
    'copyright-license-agreement-poc': '.',
    'late-payment': 'composed/late-payment',
    'licensed-work-schedule': 'documents/licensed-work-schedule',
} as const;

export const read = (...path: string[]) => readFileSync(join(ROOT, ...path), 'utf8');
export const sample = (dir: string) => JSON.parse(read(dir, 'sample.json'));

/** Every archive's models in one model manager, as a host loading the whole agreement would. */
export function loadModels(dirs: string[] = Object.values(ARCHIVES)): ModelManager {
    const models = new ModelManager();
    for (const dir of new Set(dirs)) {
        for (const file of readdirSync(join(ROOT, dir, 'model'))) {
            models.addCTOModel(read(dir, 'model', file), join(dir, file), true);
        }
    }
    models.validateModelFiles();
    return models;
}

/** A template@1.0.0 TemplateReference, hashing the archive's model, text and logic as a stand-in for its archive hash. */
export function templateReference(templateId: keyof typeof ARCHIVES) {
    const dir = ARCHIVES[templateId];
    const hash = createHash('sha256');
    for (const part of ['model', 'text', 'logic']) {
        let files: string[] = [];
        try {
            files = readdirSync(join(ROOT, dir, part)).filter(f => f.includes('.')).sort();
        } catch {
            // A stateless archive has no logic.
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
