// @ts-nocheck - test fixtures are plain JSON
// "Design B" end to end, through the engine's entry points
// (runtime/execute.ts): one agreement of two models#200 AgreementDocuments.
// The licence has an inline payment clause in its data and a late payment
// clause composed into it; the licensed work schedule is stateless.
import { Factory, Serializer } from '@accordproject/concerto-core';
import copyrightLicense from '../logic/logic';
import latePayment from '../composed/late-payment/logic/logic';
import { PaymentRequest, PaymentReceived } from '../logic/request-types';
import { execute, initialise } from '../runtime/execute';
import { amount, at, loadModels, sample, templateReference } from './support';

const AGREEMENT_NS = 'org.accordproject.agreement@1.0.0';
const COMPOSITION_NS = 'poc.accordproject.composition@0.1.0';
const LOGIC = { 'copyright-license-agreement-poc': copyrightLicense, 'late-payment': latePayment };
const EFFECTIVE_AT = '2018-01-01T00:00:00.000Z';

const models = loadModels();
const options = { models };
const serializer = new Serializer(new Factory(models), models);

const document = (documentId: string, templateId, data, clauses?) => ({
    $class: `${AGREEMENT_NS}.AgreementDocument`,
    $identifier: documentId,
    documentId,
    template: templateReference(templateId),
    data,
    ...(clauses ? { clauses } : {}),
});

function licenceAgreement({ withLatePaymentClause = true } = {}) {
    const latePaymentClause = {
        $class: `${COMPOSITION_NS}.ComposedClause`,
        clauseId: 'licence/late-payment',
        template: templateReference('late-payment'),
        data: sample('composed/late-payment'),
    };
    const documents = [
        document('licence', 'copyright-license-agreement-poc', sample('.'),
            withLatePaymentClause ? { latePayment: latePaymentClause } : undefined),
        document('schedule-1', 'licensed-work-schedule', sample('documents/licensed-work-schedule')),
    ];
    const party = (id: string, role: string) => ({
        $class: `${AGREEMENT_NS}.AgreementParty`,
        party: `resource:org.accordproject.party@1.0.0.Party#${id}`,
        role,
    });
    const agreement = {
        $class: `${AGREEMENT_NS}.Agreement`,
        $identifier: 'licence-001',
        agreementId: 'licence-001',
        documents: documents.map(d => `resource:${AGREEMENT_NS}.AgreementDocument#${d.documentId}`),
        parties: [party('me', 'licensee'), party('myself', 'licensor')],
    };
    return { agreement, documents };
}

const paymentRequest = (seconds: number) => PaymentRequest.create({ $timestamp: at(seconds) });
const paymentReceived = (unscaledValue: string, seconds: number) =>
    PaymentReceived.create({ $timestamp: at(seconds), amount: amount(unscaledValue) });

describe('an agreement as one tree of template instances (design B)', () => {
    let agreement;
    let documents;

    beforeEach(() => {
        ({ agreement, documents } = licenceAgreement());
    });

    const start = () => initialise(agreement, documents, EFFECTIVE_AT, LOGIC, options);
    const trigger = (state, documentId, request) => execute({ agreement, documents, state }, documentId, request, LOGIC, options);

    it('holds two models#200 documents, one with an inline and a composed clause, as valid instances', () => {
        expect(() => serializer.fromJSON(agreement)).not.toThrow();
        for (const d of documents) {
            expect(() => serializer.fromJSON(d)).not.toThrow();
        }
        const [licence] = documents;
        // The inline clause is a subtree of the licence's own data...
        expect(licence.data.paymentTerms.amountText).toBe('one hundred US Dollars');
        // ...while the composed clause carries its own template and data.
        expect(licence.clauses.latePayment.template.templateId).toBe('late-payment');
        expect(licence.data).not.toHaveProperty('latePayment');
    });

    it('initialises one state entry per stateful instance, and none for the stateless schedule', async () => {
        const { state, events } = await start();

        expect(Object.keys(state.states)).toEqual(['licence', 'licence/late-payment']);
        expect(state.states['licence'].paymentTerms.amountPaid.unscaledValue).toBe('0');
        expect(state.states['licence/late-payment']).toMatchObject({ remindersSent: 0, discharged: false });
        expect(state.revision).toBe(0);
        expect(events.map(e => e.$class)).toEqual([`${COMPOSITION_NS}.ObligationIssued`]);
        expect(() => serializer.fromJSON(state)).not.toThrow();
    });

    it('lets the licence read its cousin, the schedule, when it issues the obligation', async () => {
        const { events } = await start();

        expect(events[0].obligation.description).toBe('Me should pay the licence fee for "Other Stuff" to Myself');
        expect(events[0].obligation.agreement).toMatchObject({ agreementId: 'licence-001', documentId: 'licence', clausePath: 'paymentTerms' });
    });

    it('delegates a chase to the composed clause, committing only the clause\'s new state', async () => {
        const { state: initial } = await start();
        const { state: requested } = await trigger(initial, 'licence', paymentRequest(1));

        const chased = await trigger(requested, 'licence', paymentRequest(2));

        expect(chased.state.revision).toBe(2);
        expect(chased.state.states['licence']).toEqual(requested.states['licence']);
        expect(chased.state.states['licence/late-payment'].remindersSent).toBe(1);
        expect(chased.events).toEqual([expect.objectContaining({
            $class: 'poc.accordproject.latepayment@0.1.0.PaymentReminder', reminderNumber: 1, gracePeriodDays: 14,
        })]);
    });

    it('commits the licence and its composed clause together when payment in full discharges the clause', async () => {
        const { state: initial } = await start();
        const { state: requested } = await trigger(initial, 'licence', paymentRequest(1));

        const paid = await trigger(requested, 'licence', paymentReceived('10000', 2));

        expect(paid.state.revision).toBe(2);
        expect(paid.state.states['licence'].paymentTerms.amountPaid.unscaledValue).toBe('10000');
        expect(paid.state.states['licence/late-payment'].discharged).toBe(true);
        expect(paid.events).toEqual([expect.objectContaining({ fromStatus: 'DUE', toStatus: 'FULFILLED' })]);
        expect(() => serializer.fromJSON(paid.state)).not.toThrow();
    });

    it('commits nothing when the licence logic rejects a request', async () => {
        const { state: initial } = await start();
        const before = structuredClone(initial);

        await expect(trigger(initial, 'licence', paymentReceived('10001', 1)))
            .rejects.toThrow('would exceed the licence fee');
        expect(initial).toEqual(before);
    });

    it('has nothing to trigger in the stateless schedule', async () => {
        const { state } = await start();

        await expect(trigger(state, 'schedule-1', paymentRequest(1)))
            .rejects.toThrow("Instance 'schedule-1' has no logic to trigger.");
    });

    it('runs the same licence logic unchanged when no late payment clause is composed into it', async () => {
        ({ agreement, documents } = licenceAgreement({ withLatePaymentClause: false }));
        const { state: initial } = await start();
        const { state: requested } = await trigger(initial, 'licence', paymentRequest(1));

        const chased = await trigger(requested, 'licence', paymentRequest(2));
        const paid = await trigger(chased.state, 'licence', paymentReceived('10000', 3));

        expect(Object.keys(initial.states)).toEqual(['licence']);
        expect(chased.events).toEqual([]);
        expect(paid.state.states['licence'].paymentTerms.amountPaid.unscaledValue).toBe('10000');
    });

    it('is deterministic: replaying the same requests reproduces every outcome exactly', async () => {
        const replay = async () => {
            const outcomes = [await start()];
            for (const request of [paymentRequest(1), paymentRequest(2), paymentReceived('4000', 3), paymentReceived('6000', 4)]) {
                outcomes.push(await trigger(outcomes.at(-1).state, 'licence', request));
            }
            return outcomes;
        };

        expect(await replay()).toEqual(await replay());
    });

    // execute() is a function from JSON to JSON, so a stateless function
    // (e.g. one serverless invocation per request) can host the agreement:
    // load the state, run, then commit with a conditional write on the
    // revision, putting events in an outbox in the same write.
    describe('as a stateless function over a store', () => {
        class ConflictError extends Error {}

        // A stand-in for a store with conditional writes, holding JSON only.
        class Store {
            private state: string;
            readonly outbox: object[] = [];
            private readonly results = new Map<string, string>();

            constructor(state: object) {
                this.state = JSON.stringify(state);
            }

            load() {
                return JSON.parse(this.state);
            }

            result(requestId: string) {
                return this.results.has(requestId) ? JSON.parse(this.results.get(requestId)) : undefined;
            }

            commit(expectedRevision: number, requestId: string, outcome) {
                if (this.load().revision !== expectedRevision) {
                    throw new ConflictError(`Revision ${expectedRevision} is stale.`);
                }
                this.state = JSON.stringify(outcome.state);
                this.outbox.push(...outcome.events);
                this.results.set(requestId, JSON.stringify(outcome.result));
            }
        }

        // One invocation. A redelivered request returns its stored result;
        // a lost conditional write is retried from the new state, which is
        // safe because logic is deterministic and wrote nothing elsewhere.
        async function handle(store: Store, requestId: string, documentId: string, request, { onLoad = () => {} } = {}) {
            for (;;) {
                const stored = store.result(requestId);
                if (stored) {
                    return stored;
                }
                const state = store.load();
                await onLoad();
                const outcome = await execute({ agreement, documents, state }, documentId, request, LOGIC, options);
                try {
                    store.commit(state.revision, requestId, outcome);
                    return outcome.result;
                } catch (e) {
                    if (!(e instanceof ConflictError)) {
                        throw e;
                    }
                }
            }
        }

        it('retries a request whose conditional write lost a race, from the state that won', async () => {
            const store = new Store((await start()).state);
            await handle(store, 'r1', 'licence', paymentRequest(1));

            // r3, paying in full, commits while r2 is between loading and committing.
            let raced = false;
            const r2 = handle(store, 'r2', 'licence', paymentReceived('4000', 2), {
                onLoad: async () => {
                    if (!raced) {
                        raced = true;
                        await handle(store, 'r3', 'licence', paymentReceived('10000', 3));
                    }
                },
            });

            // Re-run from the state r3 committed, r2 finds the fee already paid,
            // and r2's first run left nothing behind.
            await expect(r2).rejects.toThrow('already been paid in full');
            expect(store.load().revision).toBe(2);
            expect(store.load().states['licence/late-payment'].discharged).toBe(true);
            expect(store.outbox.map(e => e.toStatus ?? e.$class)).toEqual(['DUE', 'FULFILLED']);
        });

        it('commits a retried request once, on top of the request that won', async () => {
            const store = new Store((await start()).state);

            let raced = false;
            const receipt = await handle(store, 'r2', 'licence', paymentReceived('4000', 2), {
                onLoad: async () => {
                    if (!raced) {
                        raced = true;
                        await handle(store, 'r1', 'licence', paymentRequest(1));
                    }
                },
            });

            expect(receipt.outstanding.unscaledValue).toBe('6000');
            expect(store.load().revision).toBe(2);
            expect(store.load().states['licence'].paymentTerms).toMatchObject({ dueAt: at(1), amountPaid: amount('4000') });
            expect(store.outbox.map(e => e.toStatus)).toEqual(['DUE']);
        });

        it('returns the stored result for a redelivered request, without running it again', async () => {
            const store = new Store((await start()).state);

            const first = await handle(store, 'r1', 'licence', paymentReceived('4000', 1));
            const again = await handle(store, 'r1', 'licence', paymentReceived('4000', 1));

            expect(again).toEqual(first);
            expect(store.load().revision).toBe(1);
            expect(store.load().states['licence'].paymentTerms.amountPaid).toEqual(amount('4000'));
        });
    });
});
