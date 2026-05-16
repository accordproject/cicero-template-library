import {
    ITemplateModel,
    IProperyInspection,
    IPropertyInspectionResponse,
    IRentalDepositPaymentEvent
} from "./generated/org.accordproject.rentaldepositwith@0.2.0";
import { IMonetaryAmount } from './generated/org.accordproject.money@0.3.0';

const NS = 'org.accordproject.rentaldepositwith@0.2.0';

function monetary(doubleValue: number, currencyCode: string): IMonetaryAmount {
    return {
        $class: 'org.accordproject.money@0.3.0.MonetaryAmount',
        doubleValue,
        currencyCode,
    };
}

type RentalDepositWithResponse = {
    result: IPropertyInspectionResponse;
    events: object[];
};

// @ts-ignore TemplateLogic is imported by the runtime
class RentalDepositWithLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IProperyInspection): Promise<RentalDepositWithResponse> {
        const totalPenalty = request.penalties.reduce((sum, penalty) => sum + penalty.amount.doubleValue, 0.0);
        const balance = data.depositAmount.doubleValue - totalPenalty;

        const event: IRentalDepositPaymentEvent = {
            $class: `${NS}.RentalDepositPaymentEvent`,
            $timestamp: new Date(),
            amount: monetary(balance, data.depositAmount.currencyCode),
            description: ''
        };

        return {
            result: {
                balance: monetary(balance, data.depositAmount.currencyCode),
                $timestamp: new Date(),
                $class: `${NS}.PropertyInspectionResponse`
            },
            events: [event]
        };
    }
}

export default RentalDepositWithLogic;
