// The logic API's typing (test/types.check.ts), and the generated factories.
import { spawnSync } from 'child_process';
import * as licenceTypes from '../logic/generated/types';
import * as latePaymentTypes from '../composed/late-payment/logic/generated/types';
import { ROOT, loadModels } from './support';

describe('typing', () => {
    it('type-checks the runtime, both logic files, and the compile-time checks, in strict mode', () => {
        const tsc = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', ROOT], { encoding: 'utf8' });

        expect(tsc.stdout + tsc.stderr).toBe('');
        expect(tsc.status).toBe(0);
    }, 60_000);

    it("generates a factory, under its own name, for every concrete type in each archive's models", () => {
        const models = loadModels();
        for (const factories of [licenceTypes, latePaymentTypes]) {
            for (const [name, type] of Object.entries(factories)) {
                const declaration = models.getType(type.$class);
                expect(declaration.getName()).toBe(name);
                expect(declaration.isAbstract()).toBe(false);
            }
        }
        expect(Object.keys(licenceTypes)).toEqual(expect.arrayContaining(['PayOut', 'PaymentObligation', 'LicensedWorkSchedule']));
        expect(Object.keys(latePaymentTypes)).toEqual(expect.arrayContaining(['ReminderSent', 'LatePaymentState']));
    });

    it('fills in $class, and $identifier from the identifying field', () => {
        expect(licenceTypes.Party.create({ partyId: 'me' })).toEqual({
            $class: 'org.accordproject.party@1.0.0.Party', $identifier: 'me', partyId: 'me',
        });
        expect(licenceTypes.Party.ref('me')).toBe('resource:org.accordproject.party@1.0.0.Party#me');
    });
});
