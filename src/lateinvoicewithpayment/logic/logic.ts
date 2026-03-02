import { ITemplateModel, ILateInvoiceRequest, ILateInvoiceResponse, IPaymentObligationEvent } from './generated/io.clause.lateinvoicewithpayment@0.1.0';
import { IDuration, TemporalUnit } from './generated/org.accordproject.time@0.3.0';

type LateInvoicePaymentResponse = {
    result: ILateInvoiceResponse;
    events: object[];
};

// @ts-ignore TemplateLogic is injected by the runtime
class LateInvoiceWithPaymentLogic extends TemplateLogic<ITemplateModel> {

    private addDuration(date: Date, duration: IDuration): Date {
        const result = new Date(date.getTime());
        switch (duration.unit) {
            case TemporalUnit.days:    result.setDate(result.getDate() + duration.amount); break;
            case TemporalUnit.weeks:   result.setDate(result.getDate() + duration.amount * 7); break;
            case TemporalUnit.hours:   result.setHours(result.getHours() + duration.amount); break;
            case TemporalUnit.minutes: result.setMinutes(result.getMinutes() + duration.amount); break;
            case TemporalUnit.seconds: result.setSeconds(result.getSeconds() + duration.amount); break;
            default: throw new Error(`Unsupported temporal unit: ${duration.unit}`);
        }
        return result;
    }

    async trigger(data: ITemplateModel, request: ILateInvoiceRequest): Promise<LateInvoicePaymentResponse> {
        const now = new Date();
        const terminationDate = this.addDuration(new Date(request.invoiceDue), data.maximumDelay);

        if (now >= terminationDate) {
            return {
                result: {
                    $class: 'io.clause.lateinvoicewithpayment@0.1.0.LateInvoiceResponse',
                    $timestamp: now,
                    paymentRequired: false,
                    cause: `Invoice delivered after the maximum delay of ${data.maximumDelay.amount} ${data.maximumDelay.unit}`,
                },
                events: [],
            };
        }

        const event: IPaymentObligationEvent = {
            $class: 'io.clause.lateinvoicewithpayment@0.1.0.PaymentObligationEvent',
            $timestamp: now,
            amount: request.amountDue,
            currencyCode: request.currencyCode,
            description: `${data.purchaser} should pay invoice amount to ${data.supplier}`,
        };

        return {
            result: {
                $class: 'io.clause.lateinvoicewithpayment@0.1.0.LateInvoiceResponse',
                $timestamp: now,
                paymentRequired: true,
            },
            events: [event],
        };
    }
}

export default LateInvoiceWithPaymentLogic;
