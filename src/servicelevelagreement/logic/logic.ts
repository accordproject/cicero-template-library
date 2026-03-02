import {
    ITemplateModel,
    IMonthSummary,
    IInvoiceCredit,
    IServiceCreditPaymentEvent
} from "./generated/io.clause.servicelevelagreement@0.1.0";

const NS = 'io.clause.servicelevelagreement@0.1.0';

type SLAResponse = {
    result: IInvoiceCredit;
    events: object[];
};

/**
 * Safety: round to 2 decimal places and clamp to >= 0
 */
function toFixed(credit: number): number {
    return Math.max(0.0, Math.round(credit * 100.0 + 0.5) / 100.0);
}

// @ts-ignore TemplateLogic is imported by the runtime
class ServiceLevelAgreementLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IMonthSummary): Promise<SLAResponse> {
        // Pre-conditions
        if (
            data.availability1 < 0.0 ||
            data.serviceCredit1 < 0.0 ||
            data.availability2 < 0.0 ||
            data.serviceCredit2 < 0.0
        ) {
            throw new Error('Template variables must not be negative.');
        }
        if (request.monthlyServiceLevel < 0.0 || request.monthlyServiceLevel > 100.0) {
            throw new Error('A service level must be at least 0% and at most 100%.');
        }

        // Section 3: Annex 1 schedule
        let monthlyCredit: number;
        if (request.monthlyServiceLevel < data.availability2) {
            // Row 2
            monthlyCredit = (data.serviceCredit2 / 100.0) * request.monthlyCharge;
        } else if (request.monthlyServiceLevel < data.availability1) {
            // Row 1
            monthlyCredit = (data.serviceCredit1 / 100.0) * request.monthlyCharge;
        } else {
            monthlyCredit = 0.0;
        }

        // Clause 3.3: Monthly cap
        monthlyCredit = Math.min(monthlyCredit, (data.monthlyCapPercentage / 100.0) * request.monthlyCharge);

        // Clause 3.4: Yearly cap
        const yearlyCreditCap = (data.yearlyCapPercentage / 100.0) * (request.last11MonthCharge + request.monthlyCharge);
        monthlyCredit = Math.min(monthlyCredit, yearlyCreditCap - request.last11MonthCredit);

        // No credit owed
        if (monthlyCredit <= 0.0) {
            return {
                result: {
                    monthlyCredit: 0.0,
                    $timestamp: new Date(),
                    $class: `${NS}.InvoiceCredit`
                },
                events: []
            };
        }

        const event: IServiceCreditPaymentEvent = {
            $class: `${NS}.ServiceCreditPaymentEvent`,
            $timestamp: new Date(),
            amount: monthlyCredit,
            currencyCode: data.currencyCode,
            description: `payment owed by ${data.serviceProvider} to ${data.serviceConsumer} for delivery of service downtimes`
        };

        return {
            result: {
                monthlyCredit: toFixed(monthlyCredit),
                $timestamp: new Date(),
                $class: `${NS}.InvoiceCredit`
            },
            events: [event]
        };
    }
}

export default ServiceLevelAgreementLogic;
