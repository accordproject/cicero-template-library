import {
    ILatePaymentData,
    ILatePaymentState,
    IPaymentOverdue,
    IPaymentSettled,
    IReminderSent,
    ILatePaymentDischarged,
    IPaymentReminder,
} from "./generated/poc.accordproject.latepayment@0.1.0";

const NS = 'poc.accordproject.latepayment@0.1.0';

type LatePaymentResponse = {
    result: IReminderSent | ILatePaymentDischarged;
    state: ILatePaymentState;
    events: IPaymentReminder[];
};

// @ts-ignore TemplateLogic is imported by the runtime
class LatePaymentLogic extends TemplateLogic<ILatePaymentData, ILatePaymentState> {
    async init(_data: ILatePaymentData): Promise<{ state: ILatePaymentState; events: IPaymentReminder[] }> {
        return {
            state: { $class: `${NS}.LatePaymentState`, remindersSent: 0, discharged: false },
            events: []
        };
    }

    async trigger(
        data: ILatePaymentData,
        request: IPaymentOverdue | IPaymentSettled,
        state: ILatePaymentState
    ): Promise<LatePaymentResponse> {
        if (state.discharged) {
            throw new Error('The late payment clause has been discharged.');
        }
        switch (request.$class) {
            case `${NS}.PaymentOverdue`: {
                const remindersSent = state.remindersSent + 1;
                return {
                    result: { $class: `${NS}.ReminderSent`, $timestamp: request.$timestamp, remindersSent },
                    state: { ...state, remindersSent },
                    events: [{
                        $class: `${NS}.PaymentReminder`,
                        $timestamp: request.$timestamp,
                        reminderNumber: remindersSent,
                        gracePeriodDays: data.gracePeriodDays
                    }]
                };
            }
            case `${NS}.PaymentSettled`:
                return {
                    result: { $class: `${NS}.LatePaymentDischarged`, $timestamp: request.$timestamp },
                    state: { ...state, discharged: true },
                    events: []
                };
            default:
                throw new Error(`Unsupported request type: ${request.$class}`);
        }
    }
}

export default LatePaymentLogic;
