// @ts-nocheck - test fixtures are plain JSON
import latePayment from './logic';
import { LatePaymentDischarged, LatePaymentState, PaymentOverdue, PaymentSettled } from './generated/types';
import { testInstance } from '../../../runtime/testing';
import { at, loadModels, sample } from '../../../test/support';

const models = loadModels();

describe('late payment clause logic', () => {
    const clause = (state?) => testInstance({ data: sample('composed/late-payment'), state, models });

    const initialState = async () => {
        const self = clause();
        await latePayment.start(self);
        return self.committed.state;
    };

    it('starts with no reminders sent', async () => {
        expect(await initialState()).toEqual(LatePaymentState.create({ remindersSent: 0, discharged: false }));
    });

    it('sends a numbered reminder, with the grace period, each time the payment is overdue', async () => {
        const self = clause(await initialState());

        const first = await latePayment.handle(PaymentOverdue.create({ $timestamp: at(1) }), self);
        const second = await latePayment.handle(PaymentOverdue.create({ $timestamp: at(2) }), self);

        expect(first.remindersSent).toBe(1);
        expect(second.remindersSent).toBe(2);
        expect(self.committed.state.remindersSent).toBe(2);
        expect(self.committed.events.map(e => [e.reminderNumber, e.gracePeriodDays])).toEqual([[1, 14], [2, 14]]);
    });

    it('is discharged once the payment is settled, and then rejects further requests', async () => {
        const self = clause(await initialState());

        const result = await latePayment.handle(PaymentSettled.create({ $timestamp: at(1) }), self);

        expect(LatePaymentDischarged.is(result)).toBe(true);
        expect(self.committed.state.discharged).toBe(true);
        await expect(latePayment.handle(PaymentOverdue.create({ $timestamp: at(2) }), self))
            .rejects.toThrow('has been discharged');
    });
});
