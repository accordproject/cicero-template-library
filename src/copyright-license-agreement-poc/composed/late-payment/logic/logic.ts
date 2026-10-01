import {
    ILatePaymentData,
    ILatePaymentState,
    IReminderSent,
    ILatePaymentDischarged,
    IPaymentReminder,
} from './generated/poc.accordproject.latepayment@0.1.0';
import { ApiOf, Self, defineLogic } from '../../../runtime/logic';
import { PaymentOverdue, PaymentSettled } from './request-types';

const NS = 'poc.accordproject.latepayment@0.1.0';

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
        clause.setState({ $class: `${NS}.LatePaymentState`, remindersSent: 0, discharged: false });
    })
    .on(PaymentOverdue, async (request, clause): Promise<IReminderSent> => {
        assertActive(clause);
        const remindersSent = clause.state.remindersSent + 1;
        clause.setState({ ...clause.state, remindersSent });
        const reminder: IPaymentReminder = {
            $class: `${NS}.PaymentReminder`,
            $timestamp: request.$timestamp,
            reminderNumber: remindersSent,
            gracePeriodDays: clause.data.gracePeriodDays,
        };
        clause.emit(reminder);
        return { $class: `${NS}.ReminderSent`, $timestamp: request.$timestamp, remindersSent };
    })
    .on(PaymentSettled, async (request, clause): Promise<ILatePaymentDischarged> => {
        assertActive(clause);
        clause.setState({ ...clause.state, discharged: true });
        return { $class: `${NS}.LatePaymentDischarged`, $timestamp: request.$timestamp };
    });

export default latePayment;

/** What a document composing this clause can trigger it with, and gets back. */
export type LatePayment = ApiOf<typeof latePayment>;
