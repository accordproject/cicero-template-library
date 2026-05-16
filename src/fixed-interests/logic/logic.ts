import { ITemplateModel, IFixedInterestsRequest, IFixedInterestsResponse } from "./generated/org.accordproject.fixedinterests@0.1.0";

type FixedInterestsResponse = {
    result: IFixedInterestsResponse;
};

/**
 * Round to n decimal places
 */
function roundn(x: number, n: number): number {
    const e = Math.pow(10, n);
    return Math.round(x * e) / e;
}

/**
 * Monthly payment formula from https://en.wikipedia.org/wiki/Mortgage_calculator#Monthly_payment_formula
 * test: monthlyPaymentFormula(100000.00, 2.5, 15) => 667.0
 * test: monthlyPaymentFormula(200000.00, 6.5, 30) => 1264.0
 */
function monthlyPaymentFormula(loanAmount: number, rate: number, loanDuration: number): number {
    const term = loanDuration * 12;
    if (rate === 0.0) {
        return loanAmount / term;
    }
    const monthlyRate = (rate / 12.0) / 100.0;
    const monthlyPayment =
        (monthlyRate * loanAmount) /
        (1.0 - Math.pow(1.0 + monthlyRate, -term));
    return roundn(monthlyPayment, 0);
}

// @ts-ignore TemplateLogic is imported by the runtime
class FixedInterestsLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IFixedInterestsRequest): Promise<FixedInterestsResponse> {
        const monthly = monthlyPaymentFormula(data.loanAmount, data.rate, data.loanDuration);

        return {
            result: {
                output: `loan for the amount of ${data.loanAmount}`,
                $timestamp: new Date(),
                $class: 'org.accordproject.fixedinterests@0.1.0.FixedInterestsResponse'
            }
        };
    }
}

export default FixedInterestsLogic;
