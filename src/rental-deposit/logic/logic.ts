import {
    ITemplateModel,
    IProperyInspection,
    IPropertyInspectionResponse,
    IRentalDepositPaymentEvent
} from "./generated/org.accordproject.rentaldeposit@0.2.0";
import { IMonetaryAmount, CurrencyCode } from './generated/org.accordproject.money@0.3.0';

const NS = 'org.accordproject.rentaldeposit@0.2.0';

function monetary(doubleValue: number, currencyCode: CurrencyCode): IMonetaryAmount {
    return {
        $class: 'org.accordproject.money@0.3.0.MonetaryAmount',
        doubleValue,
        currencyCode,
    };
}

type RentalDepositResponse = {
    result: IPropertyInspectionResponse;
    events: object[];
};

// @ts-ignore TemplateLogic is imported by the runtime
class RentalDepositLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IProperyInspection): Promise<RentalDepositResponse> {
        const totalPenalty = request.penalties.reduce((sum, penalty) => sum + penalty.amount.doubleValue, 0.0);
        const balance = data.depositAmount.doubleValue - totalPenalty;
        const currencyCode = data.depositAmount.currencyCode;

        const itemizedDeductions = request.penalties.length > 0
            ? request.penalties
                .map((penalty) => `${penalty.description}: ${penalty.amount.doubleValue} ${penalty.amount.currencyCode}`)
                .join(', ')
            : 'no deductions';

        const description = `Deposit return to ${data.tenant}: ${balance} ${currencyCode} ` +
            `(${data.depositAmount.doubleValue} ${currencyCode} deposit less ${itemizedDeductions}).`;

        const event: IRentalDepositPaymentEvent = {
            $class: `${NS}.RentalDepositPaymentEvent`,
            $timestamp: new Date(),
            amount: monetary(balance, currencyCode),
            description
        };

        return {
            result: {
                balance: monetary(balance, currencyCode),
                $timestamp: new Date(),
                $class: `${NS}.PropertyInspectionResponse`
            },
            events: [event]
        };
    }
}

export default RentalDepositLogic;