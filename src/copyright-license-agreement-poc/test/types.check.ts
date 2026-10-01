// Compile-time checks of the logic API's typing, run by `tsc -p .`
// (test/types.test.ts). Each `@ts-expect-error` must be an error, and
// everything else must compile. Nothing here runs.
import copyrightLicense, { Licence } from '../logic/logic';
import latePayment, { LatePayment } from '../composed/late-payment/logic/logic';
import {
    LatePaymentDischarged, LicensedWorkSchedule, PaymentObligation, PaymentOverdue, PaymentRequest, PaymentSettled, PayOut, ReminderSent,
} from '../logic/generated/types';
import { IPaymentObligation } from '../logic/generated/org.accordproject.obligation@1.0.0';
import { ApiOf, defineLogic } from '../runtime/logic';
import { stubClause, testInstance } from '../runtime/testing';
import { IPayOut, IPaymentReceipt, IPaymentRequest, IPaymentReceived } from '../logic/generated/poc.accordproject.copyrightlicense@0.1.0';
import { IReminderSent, ILatePaymentDischarged, IPaymentOverdue } from '../logic/generated/poc.accordproject.latepayment@0.1.0';

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
const assert = <T extends true>() => undefined as unknown as T;

// A logic's API is the requests it registered handlers for, each paired
// with the response type its handler declares.
type LicenceApi = ApiOf<typeof copyrightLicense>;
assert<Equals<Extract<LicenceApi, { $class: typeof PaymentRequest.$class }>['response'], IPayOut>>();
assert<Equals<Extract<LicenceApi, { request: IPaymentReceived }>['response'], IPaymentReceipt>>();
assert<Equals<ApiOf<typeof latePayment>, LatePayment>>();

declare const licence: Licence;

async function composedClauses() {
    const clause = licence.clauses.latePayment!;
    // Triggering a composed clause returns the response for that request type.
    const reminder = await clause.trigger(PaymentOverdue.create({ $timestamp: '' }));
    assert<Equals<typeof reminder, IReminderSent>>();
    const discharged = await clause.trigger(PaymentSettled.create({ $timestamp: '' }));
    assert<Equals<typeof discharged, ILatePaymentDischarged>>();
    // @ts-expect-error -- the clause doesn't handle the licence's requests.
    await clause.trigger(PaymentRequest.create({ $timestamp: '' }));
    // A request whose $class is a literal of a handled type is accepted...
    await clause.trigger({ $class: 'poc.accordproject.latepayment@0.1.0.PaymentOverdue', $timestamp: '' });
    // ...but one typed only by its interface isn't: its $class could be anything.
    const untyped: IPaymentOverdue = { $class: 'poc.accordproject.latepayment@0.1.0.PaymentOverdue', $timestamp: '' };
    // @ts-expect-error -- create requests from their request type (PaymentOverdue.create).
    await clause.trigger(untyped);
}

function readOnlyViews() {
    // @ts-expect-error -- state is written through setState, never in place.
    licence.state.paymentTerms.obligationId = 'other';
    // @ts-expect-error -- data is read-only.
    licence.data.territory = 'elsewhere';
    // @ts-expect-error -- another document's instance can be read but not written.
    licence.document.root.setState(licence.state);
    // @ts-expect-error -- only the instance's own composed clauses can be triggered, not its parent's.
    licence.parent?.clauses.get('latePayment')?.trigger;
}

function handlers() {
    defineLogic<Licence>()
        // The request and self parameters are inferred from the request type and Self.
        .on(PaymentRequest, async (request, self) => {
            assert<Equals<typeof request, IPaymentRequest>>();
            assert<Equals<typeof self, Licence>>();
            return PayOut.create({ $timestamp: request.$timestamp, amount: self.data.paymentTerms.amount });
        })
        // @ts-expect-error -- a declared response type is checked against what the handler returns.
        .on(PaymentSettled, async (request): Promise<IReminderSent> => LatePaymentDischarged.create({ $timestamp: request.$timestamp }));
}

function stubs() {
    stubClause<LatePayment>({ [PaymentOverdue.$class]: ReminderSent.create({ $timestamp: '', remindersSent: 1 }) });
    // @ts-expect-error -- a stub's responses are checked against the clause's API.
    stubClause<LatePayment>({ [PaymentOverdue.$class]: LatePaymentDischarged.create({ $timestamp: '' }) });
    testInstance<Licence>({ data: {} as never, clauses: { latePayment: stubClause<LatePayment>({}) } });
}

function factories() {
    // A factory fills in $class (and $identifier, for an identified type)...
    const payOut = PayOut.create({ $timestamp: '', amount: licence.data.paymentTerms.amount });
    assert<Equals<typeof payOut.$class, 'poc.accordproject.copyrightlicense@0.1.0.PayOut'>>();
    // @ts-expect-error -- ...so it can't be written by hand,
    PayOut.create({ $class: 'poc.accordproject.copyrightlicense@0.1.0.PayOut', $timestamp: '', amount: payOut.amount });
    // @ts-expect-error -- and every required field must be given.
    PayOut.create({ $timestamp: '' });
    // A relationship is typed as generated interfaces type it.
    assert<Equals<ReturnType<typeof PaymentObligation.ref>, IPaymentObligation>>();
    // is() narrows another template's data to its type.
    const data = licence.document.root.data;
    if (LicensedWorkSchedule.is(data)) {
        assert<Equals<typeof data.title, string>>();
    }
}

export { composedClauses, readOnlyViews, handlers, stubs, factories };
