// @ts-nocheck - test fixtures are plain JSON
import latePayment from './logic';
import { PaymentOverdue, PaymentSettled } from './request-types';
import { testInstance } from '../../../runtime/testing';
import { at, loadModels, sample } from '../../../test/support';

const NS = 'poc.accordproject.latepayment@0.1.0';
const models = loadModels();

describe('late payment clause logic', () => {
    const clause = (state?) => testInstance({ data: sample('composed/late-payment'), state, models });

    const initialState = async () => {
        const self = clause();
        await latePayment.start(self);
        return self.committed.state;
    };

    it('starts with no reminders sent', async () => {
        expect(await initialState()).toEqual({ $class: `${NS}.LatePaymentState`, remindersSent: 0, discharged: false });
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

        expect(result.$class).toBe(`${NS}.LatePaymentDischarged`);
        expect(self.committed.state.discharged).toBe(true);
        await expect(latePayment.handle(PaymentOverdue.create({ $timestamp: at(2) }), self))
            .rejects.toThrow('has been discharged');
    });
});
