import {
    ILatePaymentData,
    ILatePaymentState,
    IReminderSent,
    ILatePaymentDischarged,
} from './generated/poc.accordproject.latepayment@0.1.0';
import {
    LatePaymentDischarged,
    LatePaymentState,
    PaymentOverdue,
    PaymentReminder,
    PaymentSettled,
    ReminderSent,
} from './generated/types';
import { ApiOf, Self, defineLogic } from '../../../runtime/logic';

export type LatePaymentClause = Self<ILatePaymentData, ILatePaymentState>;

function assertActive(clause: LatePaymentClause): void {
    if (clause.state.discharged) {
        throw new Error('The late payment clause has been discharged.');
    }
}

// A clause meant to be composed into a document that owns a payment: that
// document chases an overdue payment through it, and discharges it once
// the payment is settled. It knows nothing about the document's own model.
const latePayment = defineLogic<LatePaymentClause>()
    .init(clause => {
        clause.setState(LatePaymentState.create({ remindersSent: 0, discharged: false }));
    })
    .on(PaymentOverdue, async (request, clause): Promise<IReminderSent> => {
        assertActive(clause);
        const remindersSent = clause.state.remindersSent + 1;
        clause.setState({ ...clause.state, remindersSent });
        clause.emit(PaymentReminder.create({
            $timestamp: request.$timestamp,
            reminderNumber: remindersSent,
            gracePeriodDays: clause.data.gracePeriodDays,
        }));
        return ReminderSent.create({ $timestamp: request.$timestamp, remindersSent });
    })
    .on(PaymentSettled, async (request, clause): Promise<ILatePaymentDischarged> => {
        assertActive(clause);
        clause.setState({ ...clause.state, discharged: true });
        return LatePaymentDischarged.create({ $timestamp: request.$timestamp });
    });

export default latePayment;

/** What a document composing this clause can trigger it with, and gets back. */
export type LatePayment = ApiOf<typeof latePayment>;
