import {
    ICopyrightLicenseData,
    ICopyrightLicenseState,
    IPaymentTermsState,
    IPayOut,
    IPaymentReceipt,
} from './generated/poc.accordproject.copyrightlicense@0.1.0';
import { IPreciseAmount, IUnit } from './generated/org.accordproject.money@1.0.0';
import { IObligationTransition, ObligationStatus } from './generated/org.accordproject.obligation@1.0.0';
import {
    CopyrightLicenseState,
    LicensedWorkSchedule,
    ObligationIssued,
    ObligationTransition,
    PaymentObligation,
    PaymentOverdue,
    PaymentReceipt,
    PaymentReceived,
    PaymentRequest,
    PaymentSettled,
    PaymentTermsState,
    PayOut,
    PreciseAmount,
} from './generated/types';
import { Clause, DeepReadonly, Self, defineLogic } from '@accordproject/template-engine/logic';
import type { LatePayment } from '../../late-payment-poc/logic/logic';

// The inline payment clause's path within this licence's data.
const PAYMENT_TERMS = 'paymentTerms';

/**
 * This licence, as its logic sees it. A late payment clause may be
 * composed into it at "latePayment"; the licence depends only on that
 * clause's requests and responses (`LatePayment`), never its state.
 */
export type Licence = Self<ICopyrightLicenseData, ICopyrightLicenseState, {
    latePayment?: Clause<LatePayment>;
}>;

type Data = Licence['data'];
type TermsState = DeepReadonly<IPaymentTermsState>;

function precise(unscaledValue: bigint, unit: DeepReadonly<IUnit>): IPreciseAmount {
    return PreciseAmount.create({ unscaledValue: unscaledValue.toString(), unit });
}

function sameUnit(a: DeepReadonly<IUnit>, b: DeepReadonly<IUnit>): boolean {
    return a.code === b.code && a.scheme === b.scheme && a.scale === b.scale;
}

// The obligation registry, not template state, owns the payment lifecycle.
// Clause state records only facts, from which the status is derived.
function obligationStatus(data: Data, terms: TermsState): ObligationStatus {
    if (BigInt(terms.amountPaid.unscaledValue) >= BigInt(data.paymentTerms.amount.unscaledValue)) {
        return ObligationStatus.FULFILLED;
    }
    return terms.dueAt ? ObligationStatus.DUE : ObligationStatus.PENDING;
}

// Issued at revision 0; each transition this logic emits adds one.
function obligationRevision(status: ObligationStatus, terms: TermsState): number {
    return (terms.dueAt ? 1 : 0) + (status === ObligationStatus.FULFILLED ? 1 : 0);
}

function outstanding(data: Data, terms: TermsState): IPreciseAmount {
    const due = data.paymentTerms.amount;
    return precise(BigInt(due.unscaledValue) - BigInt(terms.amountPaid.unscaledValue), due.unit);
}

function transition(terms: TermsState, fromStatus: ObligationStatus, toStatus: ObligationStatus, revision: number, effectiveAt: string): IObligationTransition {
    return ObligationTransition.create({
        $timestamp: effectiveAt,
        obligation: PaymentObligation.ref(terms.obligationId),
        fromStatus,
        toStatus,
        effectiveAt,
        revision,
    });
}

// What is licensed: the title from the agreement's licensed work schedule,
// a cousin document, if the agreement has one. Reading another template's
// data at its own type means knowing that type statically, so this
// licence's models include the schedule's.
function licensedWork(licence: Licence): string {
    for (const document of licence.document.agreement.documents.values()) {
        const data = document.root.data;
        if (LicensedWorkSchedule.is(data)) {
            return `"${data.title}"`;
        }
    }
    return licence.data.workDescription;
}

function assertUnpaid(status: ObligationStatus): void {
    if (status === ObligationStatus.FULFILLED) {
        throw new Error('The licence fee has already been paid in full.');
    }
}

// Timestamps come from the data or the request, never the clock, so
// replaying the same inputs reproduces the same state and events.
const copyrightLicense = defineLogic<Licence>()
    .init(licence => {
        const { data } = licence;
        const due = data.paymentTerms.amount;
        // Unique across agreements, so the obligation registry needs no
        // qualification from the runtime.
        const obligationId = `${licence.document.agreement.id}/${licence.document.id}/${PAYMENT_TERMS}`;
        const obligation = PaymentObligation.create({
            obligationId,
            status: ObligationStatus.PENDING,
            createdAt: data.effectiveDate,
            bearers: [data.licensee],
            beneficiaries: [data.licensor],
            agreement: licence.reference(PAYMENT_TERMS),
            description: `${data.licensee.label} should pay the licence fee for ${licensedWork(licence)} to ${data.licensor.label}`,
            revision: 0,
            amount: due,
        });
        licence.setState(CopyrightLicenseState.create({
            paymentTerms: PaymentTermsState.create({ obligationId, amountPaid: precise(0n, due.unit) }),
        }));
        licence.emit(ObligationIssued.create({ $timestamp: data.effectiveDate, obligation }));
    })
    .on(PaymentRequest, async (request, licence): Promise<IPayOut> => {
        const { data, state } = licence;
        const terms = state.paymentTerms;
        const status = obligationStatus(data, terms);
        assertUnpaid(status);

        if (status === ObligationStatus.DUE) {
            // Already requested and still outstanding: chase it through the
            // late payment clause, if one is composed into this licence.
            await licence.clauses.latePayment?.trigger(PaymentOverdue.create({ $timestamp: request.$timestamp }));
        } else {
            const next = { ...terms, dueAt: request.$timestamp };
            licence.setState({ ...state, paymentTerms: next });
            licence.emit(transition(next, status, ObligationStatus.DUE, obligationRevision(ObligationStatus.DUE, next), request.$timestamp));
        }
        return PayOut.create({ $timestamp: request.$timestamp, amount: outstanding(data, terms) });
    })
    .on(PaymentReceived, async (request, licence): Promise<IPaymentReceipt> => {
        const { data, state } = licence;
        const terms = state.paymentTerms;
        const due = data.paymentTerms.amount;
        const status = obligationStatus(data, terms);
        assertUnpaid(status);
        if (!sameUnit(request.amount.unit, due.unit)) {
            throw new Error(`Payment must be made in ${due.unit.code} at scale ${due.unit.scale}.`);
        }
        const payment = BigInt(request.amount.unscaledValue);
        if (payment <= 0n) {
            throw new Error('Payment amount must be positive.');
        }
        const amountPaid = BigInt(terms.amountPaid.unscaledValue) + payment;
        if (amountPaid > BigInt(due.unscaledValue)) {
            throw new Error('Payment would exceed the licence fee.');
        }

        const next = { ...terms, amountPaid: precise(amountPaid, due.unit) };
        licence.setState({ ...state, paymentTerms: next });
        const nextStatus = obligationStatus(data, next);
        if (nextStatus !== status) {
            licence.emit(transition(next, status, nextStatus, obligationRevision(nextStatus, next), request.$timestamp));
        }
        if (nextStatus === ObligationStatus.FULFILLED) {
            // Paying in full also discharges the late payment clause. Its
            // state is committed with the licence's in one revision, or
            // neither is if anything here throws.
            await licence.clauses.latePayment?.trigger(PaymentSettled.create({ $timestamp: request.$timestamp }));
        }
        return PaymentReceipt.create({ $timestamp: request.$timestamp, outstanding: outstanding(data, next) });
    });

export default copyrightLicense;
