// @ts-nocheck - test fixtures are plain JSON
// Unit tests of the licence's logic alone. Each test gets a `self` from
// runtime/testing.ts, runs on the engine's own transaction code, and
// stands stubs in for any composed clause. Everything written is
// validated against the models.
import copyrightLicense from './logic';
import { PaymentRequest, PaymentReceived, PaymentOverdue, PaymentSettled } from './request-types';
import { stubClause, testInstance, TEST_AGREEMENT, TEST_DOCUMENT } from '../runtime/testing';
import { amount, at, loadModels, sample, templateReference } from '../test/support';

const NS = 'poc.accordproject.copyrightlicense@0.1.0';
const OBLIGATION_NS = 'org.accordproject.obligation@1.0.0';
const OBLIGATION_ID = `${TEST_AGREEMENT}/${TEST_DOCUMENT}/paymentTerms`;
const EFFECTIVE_DATE = '2018-01-01T01:00:00.000+01:00';

const models = loadModels();

let clock = 0;
const paymentRequest = () => PaymentRequest.create({ $timestamp: at(clock++) });
const paymentReceived = (unscaledValue: string, code = 'USD', scale = 2) =>
    PaymentReceived.create({ $timestamp: at(clock++), amount: amount(unscaledValue, code, scale) });

// The licensed work schedule, as a cousin document in the same agreement.
const schedule = () => ({
    $class: 'org.accordproject.agreement@1.0.0.AgreementDocument',
    $identifier: 'schedule-1',
    documentId: 'schedule-1',
    template: templateReference('licensed-work-schedule'),
    data: sample('documents/licensed-work-schedule'),
});

describe('copyright licence logic', () => {
    let data;

    beforeEach(() => {
        data = sample('.');
    });

    const licence = (options = {}) => testInstance({ data, models, ...options });

    // Runs init then each request, committing what each one writes, as the
    // engine would. Returns the final state and every event emitted.
    const run = async (...requests) => {
        let self = licence();
        await copyrightLicense.start(self);
        let { state } = self.committed;
        const events = [...self.committed.events];
        for (const request of requests) {
            self = licence({ state });
            await copyrightLicense.handle(request, self);
            ({ state } = self.committed);
            events.push(...self.committed.events);
        }
        return { state, events };
    };

    const initialState = async () => (await run()).state;

    describe('init', () => {
        it('starts the payment clause with nothing paid and no due date', async () => {
            expect(await initialState()).toEqual({
                $class: `${NS}.CopyrightLicenseState`,
                paymentTerms: { $class: `${NS}.PaymentTermsState`, obligationId: OBLIGATION_ID, amountPaid: amount('0') },
            });
        });

        it('issues a PENDING PaymentObligation for the fee at revision 0', async () => {
            const { events } = await run();

            expect(events).toHaveLength(1);
            expect(events[0].$class).toBe('poc.accordproject.composition@0.1.0.ObligationIssued');
            expect(events[0].$timestamp).toBe(EFFECTIVE_DATE);
            expect(events[0].obligation).toMatchObject({
                $class: `${OBLIGATION_NS}.PaymentObligation`,
                obligationId: OBLIGATION_ID,
                status: 'PENDING',
                revision: 0,
                createdAt: EFFECTIVE_DATE,
                amount: amount('10000'),
                bearers: [data.licensee],
                beneficiaries: [data.licensor],
                description: 'Me should pay the licence fee for other stuff to Myself',
            });
        });

        it('references the payment clause fully, since logic can see the agreement it is in', async () => {
            const { events } = await run();

            expect(events[0].obligation.agreement).toMatchObject({
                $class: 'poc.accordproject.composition@0.1.0.DocumentReference',
                agreementId: TEST_AGREEMENT,
                documentId: TEST_DOCUMENT,
                clausePath: 'paymentTerms',
            });
        });

        it('names the licensed work from the agreement\'s schedule, a cousin document', async () => {
            const self = licence({ documents: [schedule()] });

            await copyrightLicense.start(self);

            expect(self.committed.events[0].obligation.description)
                .toBe('Me should pay the licence fee for "Other Stuff" to Myself');
        });

        it('is deterministic, so replaying init reproduces the same state and events', async () => {
            expect(await run()).toEqual(await run());
        });
    });

    describe('PaymentRequest', () => {
        it('returns the outstanding fee, timestamped by the request', async () => {
            const request = paymentRequest();

            const result = await copyrightLicense.handle(request, licence({ state: await initialState() }));

            expect(result).toEqual({ $class: `${NS}.PayOut`, $timestamp: request.$timestamp, amount: amount('10000') });
        });

        it('reads the fee from the nested paymentTerms field', async () => {
            data.paymentTerms.amount = amount('25000', 'GBP');

            const result = await copyrightLicense.handle(paymentRequest(), licence({ state: await initialState() }));

            expect(result.amount).toEqual(amount('25000', 'GBP'));
        });

        it('makes the obligation DUE: records dueAt and emits a PENDING to DUE transition', async () => {
            const self = licence({ state: await initialState() });
            const request = paymentRequest();

            await copyrightLicense.handle(request, self);

            expect(self.committed.state.paymentTerms.dueAt).toBe(request.$timestamp);
            expect(self.committed.events).toEqual([{
                $class: `${OBLIGATION_NS}.ObligationTransition`,
                $timestamp: request.$timestamp,
                obligation: `resource:${OBLIGATION_NS}.PaymentObligation#${OBLIGATION_ID}`,
                fromStatus: 'PENDING',
                toStatus: 'DUE',
                effectiveAt: request.$timestamp,
                revision: 1,
            }]);
        });

        it('sees its own write straight away, before anything is committed', async () => {
            const self = licence({ state: await initialState() });
            expect(self.state.paymentTerms.dueAt).toBeUndefined();

            await copyrightLicense.handle(paymentRequest(), self);

            expect(self.state.paymentTerms.dueAt).toBeDefined();
        });

        it('chases an already-DUE payment through the composed late payment clause', async () => {
            const { state } = await run(paymentRequest());
            const latePayment = stubClause({ [PaymentOverdue.$class]: { $class: 'poc.accordproject.latepayment@0.1.0.ReminderSent', $timestamp: at(0), remindersSent: 1 } });
            const self = licence({ state, clauses: { latePayment } });
            const request = paymentRequest();

            const result = await copyrightLicense.handle(request, self);

            expect(latePayment.calls).toEqual([{ $class: PaymentOverdue.$class, $timestamp: request.$timestamp }]);
            expect(self.committed.state).toEqual(state);
            expect(result.amount).toEqual(amount('10000'));
        });

        it('leaves an already-DUE obligation unchanged when no late payment clause is composed', async () => {
            const { state } = await run(paymentRequest());
            const self = licence({ state });

            await copyrightLicense.handle(paymentRequest(), self);

            expect(self.committed).toEqual({ state, events: [] });
        });

        it('requests only the outstanding balance after a partial payment', async () => {
            const { state } = await run(paymentReceived('4000'));

            const result = await copyrightLicense.handle(paymentRequest(), licence({ state }));

            expect(result.amount).toEqual(amount('6000'));
        });

        it('rejects a request once the fee has been paid in full', async () => {
            const { state } = await run(paymentReceived('10000'));

            await expect(copyrightLicense.handle(paymentRequest(), licence({ state })))
                .rejects.toThrow('already been paid in full');
        });
    });

    describe('PaymentReceived', () => {
        it('records a partial payment without changing the obligation status', async () => {
            const { state } = await run(paymentRequest());
            const self = licence({ state });

            const result = await copyrightLicense.handle(paymentReceived('4000'), self);

            expect(result.$class).toBe(`${NS}.PaymentReceipt`);
            expect(result.outstanding).toEqual(amount('6000'));
            expect(self.committed.state.paymentTerms.amountPaid).toEqual(amount('4000'));
            expect(self.committed.events).toHaveLength(0);
        });

        it('fulfils a DUE obligation when the balance is paid, at revision 2', async () => {
            const { state } = await run(paymentRequest(), paymentReceived('4000'));
            const self = licence({ state });

            const result = await copyrightLicense.handle(paymentReceived('6000'), self);

            expect(result.outstanding).toEqual(amount('0'));
            expect(self.committed.events).toEqual([expect.objectContaining({ fromStatus: 'DUE', toStatus: 'FULFILLED', revision: 2 })]);
        });

        it('fulfils a PENDING obligation paid before it was requested, at revision 1', async () => {
            const self = licence({ state: await initialState() });

            await copyrightLicense.handle(paymentReceived('10000'), self);

            expect(self.committed.events).toEqual([expect.objectContaining({ fromStatus: 'PENDING', toStatus: 'FULFILLED', revision: 1 })]);
        });

        it('discharges the composed late payment clause once paid in full, and only then', async () => {
            const latePayment = stubClause({ [PaymentSettled.$class]: { $class: 'poc.accordproject.latepayment@0.1.0.LatePaymentDischarged', $timestamp: at(0) } });
            const { state } = await run(paymentRequest());

            await copyrightLicense.handle(paymentReceived('4000'), licence({ state, clauses: { latePayment } }));
            expect(latePayment.calls).toEqual([]);

            const request = paymentReceived('10000');
            await copyrightLicense.handle(request, licence({ state, clauses: { latePayment } }));
            expect(latePayment.calls).toEqual([{ $class: PaymentSettled.$class, $timestamp: request.$timestamp }]);
        });

        it('keeps exact totals beyond the range doubles represent exactly', async () => {
            // 2^53 + 1 minor units: a double rounds it to 2^53.
            data.paymentTerms.amount = amount('9007199254740993');

            const { state, events } = await run(paymentReceived('9007199254740992'), paymentReceived('1'));

            expect(state.paymentTerms.amountPaid).toEqual(amount('9007199254740993'));
            expect(events.at(-1)).toMatchObject({ toStatus: 'FULFILLED' });
        });

        it('rejects a payment in a different currency or scale from the fee', async () => {
            const state = await initialState();

            await expect(copyrightLicense.handle(paymentReceived('10000', 'EUR'), licence({ state })))
                .rejects.toThrow('Payment must be made in USD at scale 2');
            await expect(copyrightLicense.handle(paymentReceived('100', 'USD', 0), licence({ state })))
                .rejects.toThrow('Payment must be made in USD at scale 2');
        });

        it('rejects a non-positive payment', async () => {
            await expect(copyrightLicense.handle(paymentReceived('0'), licence({ state: await initialState() })))
                .rejects.toThrow('must be positive');
        });

        it('rejects a payment that would exceed the fee', async () => {
            const { state } = await run(paymentReceived('4000'));

            await expect(copyrightLicense.handle(paymentReceived('6001'), licence({ state })))
                .rejects.toThrow('would exceed the licence fee');
        });

        it('rejects a payment once the fee has been paid in full', async () => {
            const { state } = await run(paymentReceived('10000'));

            await expect(copyrightLicense.handle(paymentReceived('1'), licence({ state })))
                .rejects.toThrow('already been paid in full');
        });
    });

    describe('dispatch', () => {
        it('registers a handler for exactly the licence\'s own request types', () => {
            expect(copyrightLicense.requestTypes).toEqual([PaymentRequest.$class, PaymentReceived.$class]);
        });

        it('rejects a request it has no handler for, before any logic runs', async () => {
            const self = licence({ state: await initialState() });

            await expect(copyrightLicense.handle(PaymentOverdue.create({ $timestamp: at(0) }), self))
                .rejects.toThrow(`No handler for ${PaymentOverdue.$class}.`);
            expect(self.committed.events).toEqual([]);
        });
    });

    describe('obligation registry', () => {
        // A minimal stand-in for the registry that owns the obligation: it
        // applies ObligationIssued and ObligationTransition events, checking
        // each transition against the record it holds.
        const applyObligationEvents = (events) => {
            let obligation;
            for (const event of events) {
                if (event.$class.endsWith('.ObligationIssued')) {
                    obligation = { ...event.obligation };
                    continue;
                }
                expect(event.obligation).toBe(`resource:${obligation.$class}#${obligation.obligationId}`);
                expect(event.fromStatus).toBe(obligation.status);
                expect(event.revision).toBe(obligation.revision + 1);
                obligation = { ...obligation, status: event.toStatus, revision: event.revision };
            }
            return obligation;
        };

        it('receives transitions whose fromStatus and revision match the record it holds', async () => {
            const { events } = await run(paymentRequest(), paymentRequest(), paymentReceived('4000'), paymentReceived('6000'));

            const obligation = applyObligationEvents(events);

            expect(obligation.status).toBe('FULFILLED');
            expect(obligation.revision).toBe(2);
        });
    });
});
