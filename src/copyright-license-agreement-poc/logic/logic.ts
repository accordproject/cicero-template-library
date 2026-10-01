import {
    ICopyrightLicenseData,
    ICopyrightLicenseState,
    IPaymentTermsState,
    IPaymentRequest,
    IPaymentReceived,
    IPayOut,
    IPaymentReceipt,
} from "./generated/poc.accordproject.copyrightlicense@0.1.0";
import { IPreciseAmount, IUnit } from "./generated/org.accordproject.money@1.0.0";
import { IAgreementReference } from "./generated/poc.accordproject.agreement@0.1.0";
import {
    IDurableObligation,
    IPaymentObligation,
    IObligationIssued,
    IObligationTransition,
    ObligationStatus,
} from "./generated/poc.accordproject.obligation@0.1.0";
import { IStateData } from "./generated/poc.accordproject.templatedata@0.1.0";
import {
    IPaymentOverdue,
    IPaymentSettled,
    IReminderSent,
    ILatePaymentDischarged,
    IPaymentReminder,
} from "./generated/poc.accordproject.latepayment@0.1.0";

const NS = 'poc.accordproject.copyrightlicense@0.1.0';
const OBLIGATION_NS = 'poc.accordproject.obligation@0.1.0';
const LATE_PAYMENT_NS = 'poc.accordproject.latepayment@0.1.0';

// The inline payment clause's instance path, which is also the payment
// obligation's id. Logic never sees the agreement, so the runtime qualifies
// both with the agreement and document ids when it applies the events below.
const CLAUSE_PATH = 'paymentTerms';

type CopyrightLicenseInitResponse = {
    state: ICopyrightLicenseState;
    events: IObligationIssued[];
};

// A clause composed into this licence, as the runtime links it in: it runs
// the clause template's own logic against that clause's own data and state.
// The licence depends only on the clause's request and response types and
// never reads or writes the clause's state, which stays opaque here.
type ComposedClause<Request, Result, Event> = {
    trigger(request: Request): Promise<{ result: Result; state: IStateData; events: Event[] }>;
};

// Composed clauses by instance path. Each is optional: a licence composed
// without a late payment clause works unchanged.
type CopyrightLicenseClauses = {
    latePayment?: ComposedClause<IPaymentOverdue | IPaymentSettled, IReminderSent | ILatePaymentDischarged, IPaymentReminder>;
};

type CopyrightLicenseResponse = {
    result: IPayOut | IPaymentReceipt;
    state: ICopyrightLicenseState;
    // New state for each composed clause this transition changed, by
    // instance path. The runtime commits it with `state` as one revision.
    clauseStates?: { latePayment?: IStateData };
    events: (IObligationTransition | IPaymentReminder)[];
};

function precise(unscaledValue: bigint, unit: IUnit): IPreciseAmount {
    return { $class: 'org.accordproject.money@1.0.0.PreciseAmount', unscaledValue: unscaledValue.toString(), unit };
}

function sameUnit(a: IUnit, b: IUnit): boolean {
    return a.code === b.code && a.scheme === b.scheme && a.scale === b.scale;
}

function clauseReference(): IAgreementReference {
    // agreementId is back-filled by the runtime from the envelope it owns.
    return { $class: 'poc.accordproject.agreement@0.1.0.AgreementReference', clausePath: CLAUSE_PATH } as IAgreementReference;
}

// The obligation registry, not template state, owns the payment lifecycle.
// Clause state records only facts, from which the status is derived.
function obligationStatus(data: ICopyrightLicenseData, clause: IPaymentTermsState): ObligationStatus {
    if (BigInt(clause.amountPaid.unscaledValue) >= BigInt(data.paymentTerms.amount.unscaledValue)) {
        return ObligationStatus.FULFILLED;
    }
    return clause.dueAt ? ObligationStatus.DUE : ObligationStatus.PENDING;
}

// Issued at revision 0; each transition this logic emits adds one.
function obligationRevision(status: ObligationStatus, clause: IPaymentTermsState): number {
    return (clause.dueAt ? 1 : 0) + (status === ObligationStatus.FULFILLED ? 1 : 0);
}

function outstanding(data: ICopyrightLicenseData, clause: IPaymentTermsState): IPreciseAmount {
    const due = data.paymentTerms.amount;
    return precise(BigInt(due.unscaledValue) - BigInt(clause.amountPaid.unscaledValue), due.unit);
}

function transition(
    fromStatus: ObligationStatus,
    toStatus: ObligationStatus,
    revision: number,
    // DateTime's generated type differs between Concerto codegens (a Date in
    // Concerto 4's, a string in 5's), so take whichever was generated.
    effectiveAt: IObligationTransition['effectiveAt']
): IObligationTransition {
    return {
        $class: `${OBLIGATION_NS}.ObligationTransition`,
        $timestamp: effectiveAt,
        // A relationship serializes as a "resource:<type>#<id>" string.
        obligation: `resource:${OBLIGATION_NS}.PaymentObligation#${CLAUSE_PATH}` as unknown as IDurableObligation,
        fromStatus,
        toStatus,
        effectiveAt,
        revision
    };
}

// @ts-ignore TemplateLogic is imported by the runtime
class CopyrightLicenseLogic extends TemplateLogic<ICopyrightLicenseData, ICopyrightLicenseState> {
    // `state` here and in trigger() is only the template's own StateData
    // subtype. The runtime wraps it in an identified, revisioned
    // AgreementState (model/runtime.cto) that logic never sees, just as it
    // wraps `data` in an AgreementDocument. Timestamps come from the data or
    // the request, never the clock, so replaying the same inputs reproduces
    // the same state and events.
    async init(data: ICopyrightLicenseData): Promise<CopyrightLicenseInitResponse> {
        const due = data.paymentTerms.amount;

        // `licensee`/`licensor` are `PartyRef` values: a portable,
        // already-resolved snapshot (was: a `--> Party` relationship,
        // which arrives at trigger() as an unresolvable
        // "resource:...#me" string with no registry to resolve it
        // against, requiring a hand-rolled resolveParty() helper that
        // walked a separate `parties` array). Nothing to resolve here.
        const { licensee, licensor } = data;
        const obligation: IPaymentObligation = {
            $class: `${OBLIGATION_NS}.PaymentObligation`,
            $identifier: CLAUSE_PATH,
            obligationId: CLAUSE_PATH,
            status: ObligationStatus.PENDING,
            createdAt: data.effectiveDate,
            bearers: [licensee],
            beneficiaries: [licensor],
            agreement: clauseReference(),
            description: `${licensee.label} should pay contract amount to ${licensor.label}`,
            revision: 0,
            amount: due
        };
        const issued: IObligationIssued = {
            $class: `${OBLIGATION_NS}.ObligationIssued`,
            $timestamp: data.effectiveDate,
            obligation
        };

        return {
            state: {
                $class: `${NS}.CopyrightLicenseState`,
                paymentTerms: {
                    $class: `${NS}.PaymentTermsState`,
                    obligationId: CLAUSE_PATH,
                    amountPaid: precise(0n, due.unit),
                },
            },
            events: [issued]
        };
    }

    async trigger(
        data: ICopyrightLicenseData,
        request: IPaymentRequest | IPaymentReceived,
        state: ICopyrightLicenseState,
        clauses: CopyrightLicenseClauses = {}
    ): Promise<CopyrightLicenseResponse> {
        // `data` IS the template model -- there is no envelope to unwrap
        // (was: `data.data as ICopyrightLicenseData`) and no `clauses`
        // map to fall back past (was: `clauses['paymentTerms']?.data ??
        // licenseData.paymentTerms`, which left it ambiguous which copy
        // was authoritative). `paymentTerms` is simply a nested field.
        switch (request.$class) {
            case `${NS}.PaymentRequest`:
                return this.requestPayment(data, request, state, clauses);
            case `${NS}.PaymentReceived`:
                return this.receivePayment(data, request as IPaymentReceived, state, clauses);
            default:
                throw new Error(`Unsupported request type: ${request.$class}`);
        }
    }

    private async requestPayment(
        data: ICopyrightLicenseData,
        request: IPaymentRequest,
        state: ICopyrightLicenseState,
        clauses: CopyrightLicenseClauses
    ): Promise<CopyrightLicenseResponse> {
        const clause = state.paymentTerms;
        const status = obligationStatus(data, clause);
        if (status === ObligationStatus.FULFILLED) {
            throw new Error('The licence fee has already been paid in full.');
        }

        const result: IPayOut = {
            $class: `${NS}.PayOut`,
            $timestamp: request.$timestamp,
            amount: outstanding(data, clause)
        };
        if (status === ObligationStatus.DUE) {
            // Already requested and still outstanding: chase it through the
            // late payment clause, if one is composed into this licence.
            if (!clauses.latePayment) {
                return { result, state, events: [] };
            }
            const chased = await clauses.latePayment.trigger({
                $class: `${LATE_PAYMENT_NS}.PaymentOverdue`,
                $timestamp: request.$timestamp
            });
            return { result, state, clauseStates: { latePayment: chased.state }, events: chased.events };
        }

        const next: IPaymentTermsState = { ...clause, dueAt: request.$timestamp };
        return {
            result,
            state: { ...state, paymentTerms: next },
            events: [transition(status, ObligationStatus.DUE, obligationRevision(ObligationStatus.DUE, next), request.$timestamp)]
        };
    }

    private async receivePayment(
        data: ICopyrightLicenseData,
        request: IPaymentReceived,
        state: ICopyrightLicenseState,
        clauses: CopyrightLicenseClauses
    ): Promise<CopyrightLicenseResponse> {
        const clause = state.paymentTerms;
        const due = data.paymentTerms.amount;
        const status = obligationStatus(data, clause);
        if (status === ObligationStatus.FULFILLED) {
            throw new Error('The licence fee has already been paid in full.');
        }
        if (!sameUnit(request.amount.unit, due.unit)) {
            throw new Error(`Payment must be made in ${due.unit.code} at scale ${due.unit.scale}.`);
        }
        const payment = BigInt(request.amount.unscaledValue);
        if (payment <= 0n) {
            throw new Error('Payment amount must be positive.');
        }
        const amountPaid = BigInt(clause.amountPaid.unscaledValue) + payment;
        if (amountPaid > BigInt(due.unscaledValue)) {
            throw new Error('Payment would exceed the licence fee.');
        }

        const next: IPaymentTermsState = { ...clause, amountPaid: precise(amountPaid, due.unit) };
        const nextStatus = obligationStatus(data, next);
        const response: CopyrightLicenseResponse = {
            result: {
                $class: `${NS}.PaymentReceipt`,
                $timestamp: request.$timestamp,
                outstanding: outstanding(data, next)
            },
            state: { ...state, paymentTerms: next },
            events: nextStatus === status
                ? []
                : [transition(status, nextStatus, obligationRevision(nextStatus, next), request.$timestamp)]
        };
        if (nextStatus !== ObligationStatus.FULFILLED || !clauses.latePayment) {
            return response;
        }

        // Paying in full also discharges the late payment clause: the
        // licence's own state and the clause's are returned together, so the
        // runtime commits both in one revision or neither.
        const settled = await clauses.latePayment.trigger({
            $class: `${LATE_PAYMENT_NS}.PaymentSettled`,
            $timestamp: request.$timestamp
        });
        return {
            ...response,
            clauseStates: { latePayment: settled.state },
            events: [...response.events, ...settled.events]
        };
    }
}

export default CopyrightLicenseLogic;
