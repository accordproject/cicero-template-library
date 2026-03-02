import { ITemplateModel, IPaymentRequest, IPayOut, IPaymentObligationEvent } from "./generated/io.clause.copyrightlicense@0.1.0";

type CopyrightLicenseResponse = {
    result: IPayOut;
    events: object[];
};

// @ts-ignore TemplateLogic is imported by the runtime
class CopyrightLicenseLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IPaymentRequest): Promise<CopyrightLicenseResponse> {
        const event: IPaymentObligationEvent = {
            $class: 'io.clause.copyrightlicense@0.1.0.PaymentObligationEvent',
            $timestamp: new Date(),
            amount: data.paymentClause.amount,
            currencyCode: data.paymentClause.currencyCode,
            description: `${data.licensee} should pay contract amount to ${data.licensor}`
        };

        return {
            result: {
                $class: 'io.clause.copyrightlicense@0.1.0.PayOut',
                $timestamp: new Date(),
                amount: data.paymentClause.amount,
                currencyCode: data.paymentClause.currencyCode
            },
            events: [event]
        };
    }
}

export default CopyrightLicenseLogic;
