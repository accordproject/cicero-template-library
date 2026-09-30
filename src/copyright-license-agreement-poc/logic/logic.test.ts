// @ts-nocheck - Suppress type checking for runtime mocks
declare global {
    var TemplateLogic: any;
    var EngineResponse: any;
    var InitResponse: any;
}

// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T, S = undefined> {
    async trigger(data: T, request: any, state?: S): Promise<any> { return {}; }
};
(global as any).EngineResponse = class EngineResponse<S> {};
(global as any).InitResponse = class InitResponse<S> {};

import CopyrightLicenseLogic from './logic';
import {
    ICopyrightLicenseData,
    ICopyrightLicenseState,
    IPaymentRequest,
    IPaymentReceived,
} from './generated/poc.accordproject.copyrightlicense@0.1.0';
import { IAgreementState } from './generated/poc.accordproject.runtime@0.1.0';

const NS = 'poc.accordproject.copyrightlicense@0.1.0';
const OBLIGATION_NS = 'poc.accordproject.obligation@0.1.0';
const EFFECTIVE_DATE = new Date('2018-01-01T00:00:00Z');

const amount = (unscaledValue: string, code = 'USD', scale = 2) => ({
    $class: 'poc.accordproject.money@0.1.0.PreciseAmount',
    unscaledValue,
    unit: { $class: 'poc.accordproject.money@0.1.0.Unit', code, scheme: 'iso4217', scale },
});

let clock = 0;
const nextTimestamp = () => new Date(Date.UTC(2018, 0, 2, 0, 0, clock++));

const paymentRequest = (): IPaymentRequest => ({
    $class: `${NS}.PaymentRequest`,
    $timestamp: nextTimestamp()
});

const paymentReceived = (unscaledValue: string, code = 'USD', scale = 2): IPaymentReceived => ({
    $class: `${NS}.PaymentReceived`,
    $timestamp: nextTimestamp(),
    amount: amount(unscaledValue, code, scale)
});

describe('CopyrightLicenseLogic', () => {
    let logic: CopyrightLicenseLogic;
    let data: ICopyrightLicenseData;

    beforeEach(() => {
        logic = new CopyrightLicenseLogic();

        // Raw sample data, mirroring what template-engine hands to
        // logic.trigger(): `data` IS the template model directly (no
        // envelope to unwrap, and no `clauses` map -- see logic.ts
        // comments). `licensee`/`licensor` are portable PartyRef values,
        // not relationships, so there is nothing to resolve.
        data = {
            $class: `${NS}.CopyrightLicenseData`,
            effectiveDate: EFFECTIVE_DATE,
            licensee: { $class: 'poc.accordproject.party@0.1.0.PartyRef', id: 'me', scheme: 'poc.accordproject.party@0.1.0.Party', label: 'Me' },
            licensor: { $class: 'poc.accordproject.party@0.1.0.PartyRef', id: 'myself', scheme: 'poc.accordproject.party@0.1.0.Party', label: 'Myself' },
            territory: 'United States',
            purposeDescription: 'stuff',
            workDescription: 'other stuff',
            paymentTerms: {
                $class: `${NS}.PaymentTerms`,
                amountText: 'one hundred US Dollars',
                amount: amount('10000'),
                paymentProcedure: 'bank transfer',
            },
        } as unknown as ICopyrightLicenseData;
    });

    const initialState = async (): Promise<ICopyrightLicenseState> => (await logic.init(data)).state;

    // Runs requests from the initial state, returning the final state and
    // every event emitted along the way, init's included.
    const run = async (...requests) => {
        const init = await logic.init(data);
        let state = init.state;
        const events = [...init.events];
        for (const request of requests) {
            const response = await logic.trigger(data, request, state);
            state = response.state;
            events.push(...response.events);
        }
        return { state, events };
    };

    describe('init', () => {
        it('should start the payment clause with nothing paid and no due date', async () => {
            const state = await initialState();

            expect(state.$class).toBe(`${NS}.CopyrightLicenseState`);
            expect(state.paymentTerms).toEqual({
                $class: `${NS}.PaymentTermsState`,
                obligationId: 'paymentTerms',
                amountPaid: amount('0'),
            });
        });

        it('should issue a PENDING PaymentObligation for the fee at revision 0', async () => {
            const { events } = await logic.init(data);

            expect(events).toHaveLength(1);
            const issued = events[0] as any;
            expect(issued.$class).toBe(`${OBLIGATION_NS}.ObligationIssued`);
            expect(issued.$timestamp).toEqual(EFFECTIVE_DATE);

            const obligation = issued.obligation;
            expect(obligation.$class).toBe(`${OBLIGATION_NS}.PaymentObligation`);
            expect(obligation.obligationId).toBe('paymentTerms');
            expect(obligation.status).toBe('PENDING');
            expect(obligation.revision).toBe(0);
            expect(obligation.createdAt).toEqual(EFFECTIVE_DATE);
            expect(obligation.amount).toEqual(amount('10000'));
            expect(obligation.bearers).toEqual([data.licensee]);
            expect(obligation.beneficiaries).toEqual([data.licensor]);
            expect(obligation.description).toBe('Me should pay contract amount to Myself');
        });

        it('should reference the originating clause, leaving agreementId for the runtime to back-fill', async () => {
            const { events } = await logic.init(data);

            const reference = (events[0] as any).obligation.agreement;
            expect(reference.clausePath).toBe('paymentTerms');
            expect(reference).not.toHaveProperty('agreementId');
        });

        it('should be deterministic, so replaying init reproduces the same state and events', async () => {
            expect(await logic.init(data)).toEqual(await logic.init(data));
        });

        it('should return only the template state, leaving identity and revision to the runtime envelope', async () => {
            const state = await initialState();

            expect(state).not.toHaveProperty('$identifier');
            expect(state).not.toHaveProperty('revision');
        });
    });

    describe('PaymentRequest', () => {
        it('should return the outstanding fee, timestamped by the request', async () => {
            const request = paymentRequest();

            const result = await logic.trigger(data, request, await initialState());

            expect(result.result.$class).toBe(`${NS}.PayOut`);
            expect(result.result.$timestamp).toEqual(request.$timestamp);
            expect(result.result.amount).toEqual(amount('10000'));
        });

        it('should read the fee from the nested paymentTerms field', async () => {
            (data as any).paymentTerms.amount = amount('25000', 'GBP');

            const result = await logic.trigger(data, paymentRequest(), await initialState());

            expect(result.result.amount).toEqual(amount('25000', 'GBP'));
        });

        it('should make the obligation DUE: record dueAt and emit a PENDING to DUE transition', async () => {
            const before = await initialState();
            const request = paymentRequest();

            const result = await logic.trigger(data, request, before);

            expect(result.state.paymentTerms.dueAt).toEqual(request.$timestamp);
            expect(before.paymentTerms.dueAt).toBeUndefined();
            expect(result.events).toEqual([{
                $class: `${OBLIGATION_NS}.ObligationTransition`,
                $timestamp: request.$timestamp,
                obligation: `resource:${OBLIGATION_NS}.PaymentObligation#paymentTerms`,
                fromStatus: 'PENDING',
                toStatus: 'DUE',
                effectiveAt: request.$timestamp,
                revision: 1,
            }]);
        });

        it('should leave an already-DUE obligation unchanged', async () => {
            const { state } = await run(paymentRequest());

            const result = await logic.trigger(data, paymentRequest(), state);

            expect(result.state).toEqual(state);
            expect(result.events).toHaveLength(0);
            expect(result.result.amount).toEqual(amount('10000'));
        });

        it('should request only the outstanding balance after a partial payment', async () => {
            const { state } = await run(paymentReceived('4000'));

            const result = await logic.trigger(data, paymentRequest(), state);

            expect(result.result.amount).toEqual(amount('6000'));
        });

        it('should reject a request once the fee has been paid in full', async () => {
            const { state } = await run(paymentReceived('10000'));

            await expect(logic.trigger(data, paymentRequest(), state))
                .rejects.toThrow('already been paid in full');
        });
    });

    describe('PaymentReceived', () => {
        it('should record a partial payment without changing the obligation status', async () => {
            const { state } = await run(paymentRequest());

            const result = await logic.trigger(data, paymentReceived('4000'), state);

            expect(result.result.$class).toBe(`${NS}.PaymentReceipt`);
            expect(result.result.outstanding).toEqual(amount('6000'));
            expect(result.state.paymentTerms.amountPaid).toEqual(amount('4000'));
            expect(result.events).toHaveLength(0);
        });

        it('should fulfil a DUE obligation when the balance is paid, at revision 2', async () => {
            const { state } = await run(paymentRequest(), paymentReceived('4000'));

            const result = await logic.trigger(data, paymentReceived('6000'), state);

            expect(result.result.outstanding).toEqual(amount('0'));
            expect(result.events).toHaveLength(1);
            expect(result.events[0]).toMatchObject({ fromStatus: 'DUE', toStatus: 'FULFILLED', revision: 2 });
        });

        it('should fulfil a PENDING obligation paid before it was requested, at revision 1', async () => {
            const result = await logic.trigger(data, paymentReceived('10000'), await initialState());

            expect(result.events).toHaveLength(1);
            expect(result.events[0]).toMatchObject({ fromStatus: 'PENDING', toStatus: 'FULFILLED', revision: 1 });
        });

        it('should keep exact totals beyond the range doubles represent exactly', async () => {
            // 2^53 + 1 minor units: a double rounds it to 2^53.
            (data as any).paymentTerms.amount = amount('9007199254740993');

            const { state, events } = await run(paymentReceived('9007199254740992'), paymentReceived('1'));

            expect(state.paymentTerms.amountPaid).toEqual(amount('9007199254740993'));
            expect(events.at(-1)).toMatchObject({ toStatus: 'FULFILLED' });
        });

        it('should reject a payment in a different currency or scale from the fee', async () => {
            const state = await initialState();

            await expect(logic.trigger(data, paymentReceived('10000', 'EUR'), state))
                .rejects.toThrow('Payment must be made in USD at scale 2');
            await expect(logic.trigger(data, paymentReceived('100', 'USD', 0), state))
                .rejects.toThrow('Payment must be made in USD at scale 2');
        });

        it('should reject a non-positive payment', async () => {
            await expect(logic.trigger(data, paymentReceived('0'), await initialState()))
                .rejects.toThrow('must be positive');
        });

        it('should reject a payment that would exceed the fee', async () => {
            const { state } = await run(paymentReceived('4000'));

            await expect(logic.trigger(data, paymentReceived('6001'), state))
                .rejects.toThrow('would exceed the licence fee');
        });

        it('should reject a payment once the fee has been paid in full', async () => {
            const { state } = await run(paymentReceived('10000'));

            await expect(logic.trigger(data, paymentReceived('1'), state))
                .rejects.toThrow('already been paid in full');
        });
    });

    describe('obligation registry', () => {
        // A minimal stand-in for the registry that owns the obligation: it
        // applies ObligationIssued and ObligationTransition events, checking
        // each transition against the record it holds.
        const applyObligationEvents = (events) => {
            let obligation;
            for (const event of events) {
                if (event.$class === `${OBLIGATION_NS}.ObligationIssued`) {
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

        it('should receive transitions whose fromStatus and revision match the record it holds', async () => {
            const { events } = await run(paymentRequest(), paymentRequest(), paymentReceived('4000'), paymentReceived('6000'));

            const obligation = applyObligationEvents(events);

            expect(obligation.status).toBe('FULFILLED');
            expect(obligation.revision).toBe(2);
        });
    });

    describe('runtime AgreementState envelope', () => {
        const DOCUMENT_ID = 'licence-001-document';

        // A stand-in for the runtime's side of the contract: it owns the
        // identified, revisioned AgreementState and writes each state the
        // logic returns as the next revision, under this document's entry
        // in the proposed documentStates map.
        const commit = (previous: IAgreementState | undefined, state: ICopyrightLicenseState): IAgreementState => ({
            $class: 'poc.accordproject.runtime@0.1.0.AgreementState',
            $identifier: 'licence-001-state',
            stateId: 'licence-001-state',
            agreement: 'resource:poc.accordproject.agreement@0.1.0.Agreement#licence-001' as any,
            revision: previous ? previous.revision + 1 : 0,
            effectiveAt: new Date(),
            documentStates: new Map([[DOCUMENT_ID, {
                $class: 'poc.accordproject.runtime@0.1.0.DocumentState',
                data: state,
            }]]),
        });

        it('should carry the template state as its document\'s state, one revision per transition', async () => {
            let envelope = commit(undefined, await initialState());

            for (const request of [paymentRequest(), paymentReceived('4000'), paymentReceived('6000')]) {
                const current = envelope.documentStates.get(DOCUMENT_ID).data as ICopyrightLicenseState;
                const { state } = await logic.trigger(data, request, current);
                envelope = commit(envelope, state);
            }

            const document = envelope.documentStates.get(DOCUMENT_ID);
            expect(envelope.revision).toBe(3);
            expect((document.data as ICopyrightLicenseState).paymentTerms.amountPaid).toEqual(amount('10000'));
            // The payment clause is inline, so its state is a subtree of the
            // document's data; clauseStates is only for composed archives,
            // and nothing is scoped to the agreement as a whole.
            expect(document.clauseStates).toBeUndefined();
            expect(envelope.data).toBeUndefined();
        });
    });
});
