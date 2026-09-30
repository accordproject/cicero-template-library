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

const money = (doubleValue: number, currencyCode = 'USD') =>
    ({ $class: 'org.accordproject.money@0.3.0.MonetaryAmount', doubleValue, currencyCode });

const paymentRequest = (): IPaymentRequest => ({
    $class: `${NS}.PaymentRequest`,
    $timestamp: new Date()
});

const paymentReceived = (doubleValue: number, currencyCode = 'USD'): IPaymentReceived => ({
    $class: `${NS}.PaymentReceived`,
    $timestamp: new Date(),
    amount: money(doubleValue, currencyCode)
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
            effectiveDate: new Date('2018-01-01T00:00:00Z'),
            licensee: { $class: 'poc.accordproject.party@0.1.0.PartyRef', id: 'me', scheme: 'poc.accordproject.party@0.1.0.Party', label: 'Me' },
            licensor: { $class: 'poc.accordproject.party@0.1.0.PartyRef', id: 'myself', scheme: 'poc.accordproject.party@0.1.0.Party', label: 'Myself' },
            territory: 'United States',
            purposeDescription: 'stuff',
            workDescription: 'other stuff',
            paymentTerms: {
                $class: `${NS}.PaymentTerms`,
                amountText: 'one hundred US Dollars',
                amount: money(100.0),
                paymentProcedure: 'bank transfer',
            },
        } as unknown as ICopyrightLicenseData;
    });

    const initialState = async (): Promise<ICopyrightLicenseState> => (await logic.init(data)).state;

    describe('init', () => {
        it('should start with the licence awaiting payment and the payment clause unpaid', async () => {
            const state = await initialState();

            expect(state.$class).toBe(`${NS}.CopyrightLicenseState`);
            expect(state.status).toBe('AWAITING_PAYMENT');
            expect(state.paymentTerms.$class).toBe(`${NS}.PaymentTermsState`);
            expect(state.paymentTerms.status).toBe('UNPAID');
            expect(state.paymentTerms.amountPaid).toEqual(money(0));
        });

        it('should return only the template state, leaving identity and revision to the runtime envelope', async () => {
            const state = await initialState();

            expect(state).not.toHaveProperty('$identifier');
            expect(state).not.toHaveProperty('revision');
        });
    });

    describe('PaymentRequest', () => {
        it('should return the payment amount and emit a payment obligation event', async () => {
            const result = await logic.trigger(data, paymentRequest(), await initialState());

            expect(result.result).toBeDefined();
            expect(result.result.$class).toBe(`${NS}.PayOut`);
            expect(result.result.$timestamp).toBeDefined();
            expect(result.result.amount.doubleValue).toBe(100.0);
            expect(result.result.amount.currencyCode).toBe('USD');
        });

        it('should emit a PaymentObligationEvent naming the parties from their embedded PartyRef labels', async () => {
            const result = await logic.trigger(data, paymentRequest(), await initialState());

            expect(Array.isArray(result.events)).toBe(true);
            expect(result.events).toHaveLength(1);

            const event = result.events[0] as any;
            expect(event.$class).toBe(`${NS}.PaymentObligationEvent`);
            expect(event.amount.doubleValue).toBe(100.0);
            expect(event.amount.currencyCode).toBe('USD');
            expect(event.description).toBe('Me should pay contract amount to Myself');
        });

        it('should read the payment amount from the nested paymentTerms field', async () => {
            (data as any).paymentTerms.amount = money(250.0, 'GBP');

            const result = await logic.trigger(data, paymentRequest(), await initialState());

            expect(result.result.amount.doubleValue).toBe(250.0);
            expect(result.result.amount.currencyCode).toBe('GBP');
            expect((result.events[0] as any).amount.doubleValue).toBe(250.0);
        });

        it('should move the payment clause to REQUESTED without changing the licence status', async () => {
            const before = await initialState();

            const { state } = await logic.trigger(data, paymentRequest(), before);

            expect(state.paymentTerms.status).toBe('REQUESTED');
            expect(state.status).toBe('AWAITING_PAYMENT');
            expect(before.paymentTerms.status).toBe('UNPAID');
        });

        it('should request only the outstanding balance after a partial payment', async () => {
            const { state } = await logic.trigger(data, paymentReceived(40.0), await initialState());

            const result = await logic.trigger(data, paymentRequest(), state);

            expect(result.result.amount).toEqual(money(60.0));
            expect((result.events[0] as any).amount).toEqual(money(60.0));
        });

        it('should reject a request once the fee has been paid in full', async () => {
            const { state } = await logic.trigger(data, paymentReceived(100.0), await initialState());

            await expect(logic.trigger(data, paymentRequest(), state))
                .rejects.toThrow('already been paid in full');
        });
    });

    describe('PaymentReceived', () => {
        it('should record a partial payment on the clause and leave both statuses unchanged', async () => {
            const { state: requested } = await logic.trigger(data, paymentRequest(), await initialState());

            const result = await logic.trigger(data, paymentReceived(40.0), requested);

            expect(result.result.$class).toBe(`${NS}.PaymentReceipt`);
            expect(result.result.outstanding).toEqual(money(60.0));
            expect(result.state.paymentTerms.amountPaid).toEqual(money(40.0));
            expect(result.state.paymentTerms.status).toBe('REQUESTED');
            expect(result.state.status).toBe('AWAITING_PAYMENT');
            expect(result.events).toHaveLength(0);
        });

        it('should mark the clause PAID and put the licence IN_FORCE in the same state transition', async () => {
            const { state: partlyPaid } = await logic.trigger(data, paymentReceived(40.0), await initialState());

            const result = await logic.trigger(data, paymentReceived(60.0), partlyPaid);

            expect(result.result.outstanding).toEqual(money(0));
            expect(result.state.paymentTerms.status).toBe('PAID');
            expect(result.state.paymentTerms.amountPaid).toEqual(money(100.0));
            expect(result.state.status).toBe('IN_FORCE');
        });

        it('should reject a payment in a different currency from the licence fee', async () => {
            await expect(logic.trigger(data, paymentReceived(100.0, 'EUR'), await initialState()))
                .rejects.toThrow('Payment must be made in USD');
        });

        it('should reject a non-positive payment', async () => {
            await expect(logic.trigger(data, paymentReceived(0), await initialState()))
                .rejects.toThrow('must be positive');
        });

        it('should reject a payment once the fee has been paid in full', async () => {
            const { state } = await logic.trigger(data, paymentReceived(100.0), await initialState());

            await expect(logic.trigger(data, paymentReceived(1.0), state))
                .rejects.toThrow('already been paid in full');
        });
    });

    describe('runtime AgreementState envelope', () => {
        // A stand-in for the runtime's side of the contract: it owns the
        // identified, revisioned AgreementState and writes each state the
        // logic returns as the next revision.
        const commit = (previous: IAgreementState | undefined, state: ICopyrightLicenseState): IAgreementState => ({
            $class: 'poc.accordproject.runtime@0.1.0.AgreementState',
            $identifier: 'licence-001-state',
            stateId: 'licence-001-state',
            agreement: 'resource:poc.accordproject.agreement@0.1.0.Agreement#licence-001' as any,
            revision: previous ? previous.revision + 1 : 0,
            effectiveAt: new Date(),
            data: state,
        });

        it('should carry the template state as AgreementState.data, one revision per transition', async () => {
            let envelope = commit(undefined, await initialState());

            for (const request of [paymentRequest(), paymentReceived(40.0), paymentReceived(60.0)]) {
                const { state } = await logic.trigger(data, request, envelope.data as ICopyrightLicenseState);
                envelope = commit(envelope, state);
            }

            const final = envelope.data as ICopyrightLicenseState;
            expect(envelope.revision).toBe(3);
            expect(final.status).toBe('IN_FORCE');
            expect(final.paymentTerms.status).toBe('PAID');
            // The payment clause is inline, so its state is a subtree of
            // `data`; clauseStates is only for composed sub-template archives.
            expect(envelope.clauseStates).toBeUndefined();
        });
    });
});
