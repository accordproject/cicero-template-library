import { ITemplateModel, IRateObservation, IResult } from "./generated/org.accordproject.isda.irs@0.1.0";

type InterestRateSwapResponse = {
    result: IResult;
};

function compoundInterestMultiple(annualInterest: number, numberOfDays: number): number {
    return Math.pow(1.0 + annualInterest, numberOfDays / 365.0);
}

// @ts-ignore TemplateLogic is imported by the runtime
class InterestRateSwapLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IRateObservation): Promise<InterestRateSwapResponse> {
        if (data.fixedRate < 0.0) {
            throw new Error('Fixed rate cannot be negative');
        }
        if (data.notionalAmount < 0.0) {
            throw new Error('Notional amount cannot be negative');
        }

        return {
            result: {
                outstandingBalance: 10.0,
                $timestamp: new Date(),
                $class: 'org.accordproject.isda.irs@0.1.0.Result'
            }
        };
    }
}

export default InterestRateSwapLogic;
