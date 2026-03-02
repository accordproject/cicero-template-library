import { ITemplateModel, IPaymentRequest, IPayOut } from "./generated/org.accordproject.carrentaltr@0.1.0";

type CarRentalResponse = {
    result: IPayOut;
};

// @ts-ignore TemplateLogic is imported by the runtime
class CarRentalLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IPaymentRequest): Promise<CarRentalResponse> {
        return {
            result: {
                $class: 'org.accordproject.carrentaltr@0.1.0.PayOut',
                $timestamp: new Date(),
                amount: data.paymentClause.amount,
                currencyCode: data.paymentClause.currencyCode
            }
        };
    }
}

export default CarRentalLogic;
