// DRAFT for the next major release. `@accordproject/template-engine` is the
// draft pre-release major, which is not published: the tests alias it to a
// checkout of the next-major engine (vitest.config.js in the licence), and
// the generated modules come from the draft base namespaces (npm run
// compile in the licence, which generates this clause's modules too).

import { defineLogic, type Self } from '@accordproject/template-engine';
import {
    LatePaymentCleared,
    LateFeeAccrued,
    NothingOutstanding,
    PaymentOverdue,
    PaymentSettled,
    ReminderLimitReached,
    ReminderSent,
} from './generated/org.accordproject.latepayment.api@1.2.0.js';
import type { IAmountOutstanding } from './generated/org.accordproject.outstanding.api@1.0.0.js';
import {
    LatePaymentState,
    PaymentReminder,
    type ILatePaymentData,
    type ILatePaymentState,
} from './generated/poc.accordproject.latepayment@0.1.0.js';
import { addDays } from './helpers.js';

// A clause in a slot: no clauses of its own and no other documents. It reads
// one fact, `outstanding` (manifest "reads"): what is owed now. Composed, its
// parent provides it; alone, the host supplies it. Required.
type None = Record<never, never>;
type Facts = { outstanding: IAmountOutstanding };
type LatePaymentSelf = Self<ILatePaymentData, ILatePaymentState, None, Facts, None>;

const next = (self: LatePaymentSelf, change: Partial<ILatePaymentState>) =>
    self.setState(LatePaymentState.create({ ...self.state, ...change }));

export default defineLogic<LatePaymentSelf>()
    .init((self) => {
        self.setState(LatePaymentState.create({ remindersSent: 0, pendingReminders: [], settled: false }));
    })

    // An amount is overdue. Read what is owed (the `outstanding` fact) and
    // send the next reminder for it, as an effect the clause keeps pending
    // until its outcome comes back; the first one accrues the late fee. Say
    // when the next reminder is due, unless this was the last the terms
    // allow. Once every reminder is sent, or when nothing is owed, decline:
    // the parent decides what to do, and nothing this call wrote is kept.
    .on(PaymentOverdue, (_request, self) => {
        const { reminderLimit, reminderIntervalDays, lateFee } = self.data;
        const owed = self.facts.outstanding;
        if (BigInt(owed.amount.unscaledValue) <= 0n || !owed.dueAt) return NothingOutstanding.create({});
        const sent = self.state.remindersSent;
        if (sent >= reminderLimit) return ReminderLimitReached.create({ remindersSent: sent });

        const reminder = sent + 1;
        const effectId = self.emit(PaymentReminder.create({
            to: owed.obligor,
            from: owed.obligee,
            amount: owed.amount,
            dueAt: owed.dueAt,
            reminder,
        }));
        if (reminder === 1) {
            self.notify(LateFeeAccrued.create({ obligor: owed.obligor, obligee: owed.obligee, amount: lateFee }));
        }
        next(self, { remindersSent: reminder, pendingReminders: [...self.state.pendingReminders, effectId], settled: false });

        return reminder < reminderLimit
            ? ReminderSent.create({ reminder, nextReminderAt: addDays(self.now, reminderIntervalDays) })
            : ReminderSent.create({ reminder });
    })

    // The overdue amount is paid: the reminders stop.
    .on(PaymentSettled, (_request, self) => {
        next(self, { settled: true });
        return LatePaymentCleared.create({ remindersSent: self.state.remindersSent });
    })

    // A reminder's outcome. Either way it is no longer pending; a reminder
    // the host could not deliver still counts as sent (the terms count
    // reminders, not deliveries).
    .onOutcome(PaymentReminder, (outcome, self) => {
        next(self, { pendingReminders: self.state.pendingReminders.filter((id) => id !== outcome.effectId) });
    });
