import { IFood, IOutcome, IBill, ITemplateModel } from "./generated/org.accordproject.eatapples@0.2.0";
import { IMonetaryAmount } from './generated/org.accordproject.money@0.3.0';

type EatApplesResponse = {
    result: IOutcome;
    events: object[];
}

function monetary(doubleValue: number, currencyCode: string): IMonetaryAmount {
    return {
        $class: 'org.accordproject.money@0.3.0.MonetaryAmount',
        doubleValue,
        currencyCode,
    };
}

// @ts-ignore
class EatApplesLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IFood): Promise<EatApplesResponse> {
        if (request.produce !== 'apple') {
            return {
                result: {
                    notice: "You're fired!",
                    $timestamp: new Date(),
                    $class: 'org.accordproject.eatapples@0.2.0.Outcome'
                },
                events: []
            };
        }

        const bill: IBill = {
            $class: 'org.accordproject.eatapples@0.2.0.Bill',
            $timestamp: new Date(),
            billTo: data.employee,
            amount: monetary(request.price.doubleValue * (1.0 + data.tax / 100.0), request.price.currencyCode)
        };

        return {
            result: {
                notice: 'Very healthy!',
                $timestamp: new Date(),
                $class: 'org.accordproject.eatapples@0.2.0.Outcome'
            },
            events: [bill]
        };
    }
}

export default EatApplesLogic;
