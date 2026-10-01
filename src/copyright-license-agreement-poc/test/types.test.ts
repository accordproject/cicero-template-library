// The logic API's typing (test/types.check.ts) and the hand-written
// request type constants, which template-engine would generate.
import { spawnSync } from 'child_process';
import * as licenceRequestTypes from '../logic/request-types';
import * as latePaymentRequestTypes from '../composed/late-payment/logic/request-types';
import { ROOT, loadModels } from './support';

describe('typing', () => {
    it('type-checks the runtime, both logic files, and the compile-time checks, in strict mode', () => {
        const tsc = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', ROOT], { encoding: 'utf8' });

        expect(tsc.stdout + tsc.stderr).toBe('');
        expect(tsc.status).toBe(0);
    }, 60_000);

    it('declares request type constants that match Request types in the models, under their own names', () => {
        const models = loadModels();
        for (const [name, type] of Object.entries({ ...licenceRequestTypes, ...latePaymentRequestTypes })) {
            const declaration = models.getType(type.$class);
            expect(declaration.getName()).toBe(name);
            expect(declaration.getAllSuperTypeDeclarations().map(d => d.getFullyQualifiedName()))
                .toContain('org.accordproject.runtime@1.0.0.Request');
        }
    });
});
