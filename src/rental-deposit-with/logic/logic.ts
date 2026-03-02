import {
    ITemplateModel,
    IProperyInspection,
    IPropertyInspectionResponse,
    IRentalDepositPaymentEvent
} from "./generated/io.clause.rentaldepositwith@0.1.0";

const NS = 'io.clause.rentaldepositwith@0.1.0';

type RentalDepositWithResponse = {
    result: IPropertyInspectionResponse;
    events: object[];
};

// @ts-ignore TemplateLogic is imported by the runtime
class RentalDepositWithLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IProperyInspection): Promise<RentalDepositWithResponse> {
        const totalPenalty = request.penalties.reduce((sum, penalty) => sum + penalty.amount, 0.0);
        const balance = data.depositAmount - totalPenalty;

        const event: IRentalDepositPaymentEvent = {
            $class: `${NS}.RentalDepositPaymentEvent`,
            $timestamp: new Date(),
            amount: balance,
            currencyCode: data.currencyCode,
            description: ''
        };

        return {
            result: {
                balance,
                currencyCode: data.currencyCode,
                $timestamp: new Date(),
                $class: `${NS}.PropertyInspectionResponse`
            },
            events: [event]
        };
    }
}

export default RentalDepositWithLogic;
