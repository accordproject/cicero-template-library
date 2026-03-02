import { IFood, IOutcome, IBill, ITemplateModel } from "./generated/org.accordproject.eatapples@0.1.0";

type EatApplesResponse = {
    result: IOutcome;
    events: object[];
}

// @ts-ignore
class EatApplesLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IFood): Promise<EatApplesResponse> {
        if (request.produce !== 'apple') {
            return {
                result: {
                    notice: "You're fired!",
                    $timestamp: new Date(),
                    $class: 'org.accordproject.eatapples@0.1.0.Outcome'
                },
                events: []
            };
        }

        const bill: IBill = {
            $class: 'org.accordproject.eatapples@0.1.0.Bill',
            $timestamp: new Date(),
            billTo: data.employee,
            amount: request.price * (1.0 + data.tax / 100.0)
        };

        return {
            result: {
                notice: 'Very healthy!',
                $timestamp: new Date(),
                $class: 'org.accordproject.eatapples@0.1.0.Outcome'
            },
            events: [bill]
        };
    }
}

export default EatApplesLogic;
