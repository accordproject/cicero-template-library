// @ts-nocheck - Suppress type checking for runtime mocks
// "Design B" end to end: one agreement of two documents, each a tree of
// template instances, with runtime state in a flat index keyed by
// instanceId. The licence document composes a late payment clause; the
// licensed work schedule is stateless. agreement/host.ts stands in for the
// runtime.
(global as any).TemplateLogic = class TemplateLogic {};

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { ModelManager, Factory, Serializer } from '@accordproject/concerto-core';
import CopyrightLicenseLogic from '../logic/logic';
import LatePaymentLogic from '../composed/late-payment/logic/logic';
import { AgreementHost } from '../agreement/host';

const TEMPLATE_DIR = join(__dirname, '..');
const AGREEMENT_NS = 'poc.accordproject.agreement@0.1.0';
const LICENCE_NS = 'poc.accordproject.copyrightlicense@0.1.0';
const OBLIGATION_NS = 'poc.accordproject.obligation@0.1.0';
const LATE_PAYMENT_NS = 'poc.accordproject.latepayment@0.1.0';

const read = (...path: string[]) => readFileSync(join(TEMPLATE_DIR, ...path), 'utf8');
const sample = (dir: string) => JSON.parse(read(dir, 'sample.json'));

const LOGIC = {
    'copyright-license-agreement-poc': CopyrightLicenseLogic,
    'late-payment': LatePaymentLogic,
};

function instance(instanceId: string, templateId: string, data: object, children?: Record<string, object>) {
    return {
        $class: `${AGREEMENT_NS}.TemplateInstance`,
        instanceId,
        template: { $class: `${AGREEMENT_NS}.TemplateReference`, templateId, version: '0.1.0' },
        data,
        ...(children ? { children: new Map(Object.entries(children)) } : {}),
    };
}

// The licence (with its inline payment terms in its own data, and a late
// payment clause composed at "latePayment") and its schedule.
function licenceAgreement({ withLatePaymentClause = true } = {}) {
    const latePayment = instance('licence/late-payment', 'late-payment', sample('composed/late-payment'));
    return {
        $class: `${AGREEMENT_NS}.Agreement`,
        $identifier: 'licence-001',
        agreementId: 'licence-001',
        documents: [
            {
                $class: `${AGREEMENT_NS}.AgreementDocument`,
                documentId: 'licence',
                root: instance('licence', 'copyright-license-agreement-poc', sample('.'),
                    withLatePaymentClause ? { latePayment } : undefined),
            },
            {
                $class: `${AGREEMENT_NS}.AgreementDocument`,
                documentId: 'schedule-1',
                root: instance('schedule-1', 'licensed-work-schedule', sample('documents/licensed-work-schedule')),
            },
        ],
    };
}

// Concerto 5 validation against every archive's models at once.
const serializer = (() => {
    const modelManager = new ModelManager();
    for (const dir of ['.', 'composed/late-payment', 'documents/licensed-work-schedule']) {
        for (const file of readdirSync(join(TEMPLATE_DIR, dir, 'model'))) {
            modelManager.addCTOModel(read(dir, 'model', file), join(dir, file), true);
        }
    }
    modelManager.validateModelFiles();
    return new Serializer(new Factory(modelManager), modelManager);
})();
const asJSON = (value: object) => JSON.parse(JSON.stringify(value, (_key, v) => (v instanceof Map ? Object.fromEntries(v) : v)));
const validate = (value: object) => serializer.fromJSON(asJSON(value));

const at = (seconds: number) => new Date(Date.UTC(2018, 0, 2, 0, 0, seconds)).toISOString();
const paymentRequest = (seconds: number) => ({ $class: `${LICENCE_NS}.PaymentRequest`, $timestamp: at(seconds) });
const paymentReceived = (unscaledValue: string, seconds: number) => ({
    $class: `${LICENCE_NS}.PaymentReceived`,
    $timestamp: at(seconds),
    amount: {
        $class: 'org.accordproject.money@1.0.0.PreciseAmount',
        unscaledValue,
        unit: { $class: 'org.accordproject.money@1.0.0.Unit', code: 'USD', scheme: 'iso4217', scale: 2 },
    },
});

describe('an agreement as one tree of template instances (design B)', () => {
    let host: AgreementHost;

    beforeEach(() => {
        host = new AgreementHost(licenceAgreement(), LOGIC);
    });

    it('holds two documents, one with an inline and a composed clause, as a single valid structure', () => {
        const agreement = licenceAgreement();

        expect(() => validate(agreement)).not.toThrow();
        const licence = agreement.documents[0].root;
        // The inline clause is a subtree of the licence's own data...
        expect(licence.data.paymentTerms.amountText).toBe('one hundred US Dollars');
        // ...while the composed clause is a child instance with its own template and data.
        expect(licence.children.get('latePayment').template.templateId).toBe('late-payment');
        expect(licence.data).not.toHaveProperty('latePayment');
    });

    it('initialises one state entry per stateful instance, and none for the stateless schedule', async () => {
        const { state, events } = await host.init('2018-01-01T00:00:00.000Z');

        expect([...state.states.keys()]).toEqual(['licence', 'licence/late-payment']);
        expect(state.states.get('licence').paymentTerms.amountPaid.unscaledValue).toBe('0');
        expect(state.states.get('licence/late-payment')).toMatchObject({ remindersSent: 0, discharged: false });
        expect(state.revision).toBe(0);
        expect(events.map(e => e.$class)).toEqual([`${OBLIGATION_NS}.ObligationIssued`]);
        expect(() => validate(state)).not.toThrow();
    });

    it('delegates a chase to the composed clause, committing only the clause\'s new state', async () => {
        const { state: initial } = await host.init('2018-01-01T00:00:00.000Z');
        const { state: requested } = await host.trigger(initial, 'licence', paymentRequest(1));

        const chased = await host.trigger(requested, 'licence', paymentRequest(2));

        expect(chased.state.revision).toBe(2);
        expect(chased.state.states.get('licence')).toEqual(requested.states.get('licence'));
        expect(chased.state.states.get('licence/late-payment').remindersSent).toBe(1);
        expect(chased.events).toEqual([expect.objectContaining({
            $class: `${LATE_PAYMENT_NS}.PaymentReminder`, reminderNumber: 1, gracePeriodDays: 14,
        })]);
    });

    it('commits the licence and its composed clause together when payment in full discharges the clause', async () => {
        const { state: initial } = await host.init('2018-01-01T00:00:00.000Z');
        const { state: requested } = await host.trigger(initial, 'licence', paymentRequest(1));

        const paid = await host.trigger(requested, 'licence', paymentReceived('10000', 2));

        expect(paid.state.revision).toBe(2);
        expect(paid.state.states.get('licence').paymentTerms.amountPaid.unscaledValue).toBe('10000');
        expect(paid.state.states.get('licence/late-payment').discharged).toBe(true);
        expect(paid.events).toEqual([expect.objectContaining({ fromStatus: 'DUE', toStatus: 'FULFILLED' })]);
        expect(() => validate(paid.state)).not.toThrow();
    });

    it('commits nothing when the licence logic rejects a request', async () => {
        const { state: initial } = await host.init('2018-01-01T00:00:00.000Z');

        await expect(host.trigger(initial, 'licence', paymentReceived('10001', 1)))
            .rejects.toThrow('would exceed the licence fee');
        expect(initial.revision).toBe(0);
        expect(initial.states.get('licence').paymentTerms.amountPaid.unscaledValue).toBe('0');
    });

    it('has nothing to trigger in the stateless schedule', async () => {
        const { state } = await host.init('2018-01-01T00:00:00.000Z');

        await expect(host.trigger(state, 'schedule-1', paymentRequest(1)))
            .rejects.toThrow("Document 'schedule-1' has no logic to trigger");
    });

    it('runs the same licence logic unchanged when no late payment clause is composed into it', async () => {
        const plain = new AgreementHost(licenceAgreement({ withLatePaymentClause: false }), LOGIC);
        const { state: initial } = await plain.init('2018-01-01T00:00:00.000Z');
        const { state: requested } = await plain.trigger(initial, 'licence', paymentRequest(1));

        const chased = await plain.trigger(requested, 'licence', paymentRequest(2));
        const paid = await plain.trigger(chased.state, 'licence', paymentReceived('10000', 3));

        expect([...initial.states.keys()]).toEqual(['licence']);
        expect(chased.events).toEqual([]);
        expect(paid.state.states.get('licence').paymentTerms.amountPaid.unscaledValue).toBe('10000');
    });
});
