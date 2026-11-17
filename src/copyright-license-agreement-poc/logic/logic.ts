// DRAFT for the next major release. `@accordproject/template-engine` is the
// draft pre-release major, which is not published: the tests alias it to a
// checkout of the next-major engine (vitest.config.js), and the generated
// modules come from the draft base namespaces (npm run compile).

import { defineLogic, digestOf, type ClauseHandle, type Self } from '@accordproject/template-engine';
import {
    Acceptance,
    AcceptanceRefused,
    AcceptLicence,
    CopyrightLicenseState,
    FeeOverdue,
    FeePaymentRefused,
    FeeSettled,
    LicenceAccepted,
    OverdueHandled,
    PaymentRequest,
    PayOut,
    RecordFeePayment,
    type ICopyrightLicenseData,
    type ICopyrightLicenseState,
} from './generated/poc.accordproject.copyrightlicense@0.2.0.js';
import {
    LatePaymentCleared,
    PaymentOverdue,
    PaymentSettled,
    ReminderSent,
    type ILatePaymentCleared,
    type IPaymentOverdue,
    type IPaymentSettled,
    type IReminderLimitReached,
    type IReminderSent,
} from './generated/org.accordproject.latepayment.api@1.2.0.js';
import { ActorPrincipal, PaymentObligation } from './generated/org.accordproject.runtime@1.0.0.js';
import type { ITemplateData } from './generated/org.accordproject.templatedata@1.0.0.js';
import type { CopyrightLicenseAgreementPocDocuments } from './generated/documents.js';

/**
 * The late payment interface, as the licence calls it: each member's
 * request and what it may answer (its @Returns and @Declines).
 */
type LatePaymentApi = {
    PaymentOverdue: { request: IPaymentOverdue; response: IReminderSent | IReminderLimitReached };
    PaymentSettled: { request: IPaymentSettled; response: ILatePaymentCleared };
};

// The licence's one slot: the late payment clause, optional, reached only
// through its interface (the licence reads none of its data). It reads no
// facts.
type Clauses = { latePayment: ClauseHandle<ITemplateData, LatePaymentApi> | undefined };
type NoFacts = Record<never, never>;

// self.documents.schedule: the schedule of licensed works, a text document (data, no trigger).
type LicenceSelf = Self<ICopyrightLicenseData, ICopyrightLicenseState, Clauses, NoFacts, CopyrightLicenseAgreementPocDocuments>;

/** The licence's one timer: the fee's due date, then each reminder date the late payment clause gives. */
const OVERDUE_TIMER = 'fee-overdue';

/** The term the obligation comes from: "Licensee shall pay Licensor a one-time fee" (text/grammar.md, Payment). */
const OBLIGATION = 'One-time licence fee';

/**
 * What a party accepts: the whole agreement, the licence and its schedule,
 * as its terms stand. The digest binds the agreement's terms version
 * (self.agreementTermsHash, every document's drafted text and data), so a
 * change to either document gives a new digest, and a re-pin that changes
 * only logic keeps it. A host computes it the same way to show the party
 * what it accepts.
 */
export function acceptanceDigest(partyId: string, agreementTermsHash: string): string {
    return digestOf({ party: partyId, agreementTermsHash });
}

const withState = (self: LicenceSelf, change: Partial<ICopyrightLicenseState>) =>
    self.setState(CopyrightLicenseState.create({ ...self.state, ...change }));

export default defineLogic<LicenceSelf>()
    // The licence starts with no acceptances, and the fee not yet asked for.
    .init((self) => {
        self.setState(CopyrightLicenseState.create({ acceptances: [], fee: 'NOT_DUE' }));
    })

    // Licensee shall pay Licensor a one-time fee in the amount the payment
    // terms state. The obligation tells observers the fee is owed; the
    // payment itself would reach the licence later as a request. No due
    // date is named, so the obligation has none. Nothing is refused
    // (PaymentRequest has no @Declines).
    //
    // The logic writes no prose (design: "Runtime text is data or
    // drafted"): who owes whom, and how much, travel as typed fields
    // (obligor, obligee, amount), and an observer renders them. The
    // description names the term the obligation comes from, in the
    // agreement's own words; it is built from no data.
    //
    // The first request makes the fee due and sets a timer for the due date
    // the payment terms name. A later one, or one after payment, changes
    // nothing and answers the same amount.
    .on(PaymentRequest, (_request, self) => {
        const { licensee, licensor, paymentTerms } = self.data;
        const amount = paymentTerms.amount;
        if (self.state.fee !== 'NOT_DUE') return PayOut.create({ amount });

        self.notify(PaymentObligation.create({
            obligor: licensee,
            obligee: licensor,
            amount,
            dueAt: paymentTerms.dueDate,
            description: OBLIGATION,
        }));
        self.setTimer(OVERDUE_TIMER, paymentTerms.dueDate, FeeOverdue.create({}));
        withState(self, { fee: 'DUE' });

        return PayOut.create({ amount });
    })

    // The timer fired: the fee is overdue. If the agreement has a late
    // payment clause, the licence tells it, and sets the timer again for the
    // next reminder date the clause gives. When the clause has sent every
    // reminder it allows it declines, its writes are discarded, and the
    // licence sets no more timers. Without a clause, nothing happens.
    .on(FeeOverdue, (_firing, self) => {
        const latePayment = self.clauses.latePayment;
        if (self.state.fee !== 'DUE' || !latePayment) return OverdueHandled.create({});

        const { licensee, licensor, paymentTerms } = self.data;
        const reply = latePayment.trigger(PaymentOverdue.create({
            obligor: licensee,
            obligee: licensor,
            amount: paymentTerms.amount,
            dueAt: paymentTerms.dueDate,
        }));
        if (!ReminderSent.is(reply)) return OverdueHandled.create({});
        if (reply.nextReminderAt) self.setTimer(OVERDUE_TIMER, reply.nextReminderAt, FeeOverdue.create({}));
        return OverdueHandled.create({ reminder: reply.reminder });
    })

    // The licensor records the fee paid. The overdue timer is cancelled, and
    // the late payment clause, if there is one, stops its reminders.
    .on(RecordFeePayment, (_request, self) => {
        const principal = self.principal;
        if (!ActorPrincipal.is(principal) || principal.actor.partyId !== self.data.licensor.partyId) {
            return FeePaymentRefused.create({ reason: 'NOT_THE_LICENSOR' });
        }
        if (self.state.fee !== 'DUE') return FeePaymentRefused.create({ reason: 'NOT_DUE' });

        self.cancelTimer(OVERDUE_TIMER);
        withState(self, { fee: 'PAID' });
        const amount = self.data.paymentTerms.amount;
        const latePayment = self.clauses.latePayment;
        if (!latePayment) return FeeSettled.create({ amount });
        const cleared = latePayment.trigger(PaymentSettled.create({}));
        return LatePaymentCleared.is(cleared)
            ? FeeSettled.create({ amount, remindersSent: cleared.remindersSent })
            : FeeSettled.create({ amount });
    })

    // A party accepts the whole agreement. Only the licensee or the licensor
    // (as the host attests the caller) accepts, and only the agreement as it
    // stands: the digest must be the one acceptanceDigest gives for that
    // party and the agreement's terms version now. A party's later
    // acceptance replaces its earlier one.
    .on(AcceptLicence, (request, self) => {
        const principal = self.principal;
        const party = ActorPrincipal.is(principal)
            ? [self.data.licensee, self.data.licensor].find((p) => p.partyId === principal.actor.partyId)
            : undefined;
        if (!party) return AcceptanceRefused.create({ reason: 'NOT_A_PARTY' });
        if (request.digest !== acceptanceDigest(party.partyId, self.agreementTermsHash)) {
            return AcceptanceRefused.create({ reason: 'TERMS_CHANGED' });
        }
        withState(self, {
            acceptances: [
                ...self.state.acceptances.filter((a) => a.party.partyId !== party.partyId),
                Acceptance.create({ party, digest: request.digest, acceptedAt: self.now }),
            ],
        });
        return LicenceAccepted.create({ party, agreementTermsHash: self.agreementTermsHash });
    });
