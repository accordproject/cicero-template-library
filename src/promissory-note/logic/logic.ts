import { IPayment, IResult, ITemplateModel } from "./generated/io.clause.promissorynote@0.1.0";

type PromissoryNoteResponse = {
    result: IResult;
};

function compoundInterestMultiple(annualInterest: number, numberOfDays: number): number {
    return Math.pow(1.0 + annualInterest, numberOfDays / 365.0);
}

// @ts-ignore
class PromissoryNoteLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IPayment): Promise<PromissoryNoteResponse> {
        if (data.interestRate < 0.0) {
            throw new Error('Interest rate must be non-negative');
        }
        if (data.amount < 0.0) {
            throw new Error('Amount must be non-negative');
        }

        const outstanding = data.amount - request.amountPaid;
        if (outstanding < 0.0) {
            throw new Error('Amount paid exceeds outstanding balance');
        }

        // Fixed reference date: 17 May 2018 13:53:33 EST
        const referenceDate = new Date('2018-05-17T13:53:33-05:00');
        const contractDate = new Date(data.date);
        const diffMs = referenceDate.getTime() - contractDate.getTime();
        const numberOfDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (numberOfDays < 0) {
            throw new Error('Number of days must be non-negative');
        }

        const compounded = outstanding * compoundInterestMultiple(data.interestRate, numberOfDays);

        return {
            result: {
                outstandingBalance: compounded,
                $timestamp: new Date(),
                $class: 'io.clause.promissorynote@0.1.0.Result'
            }
        };
    }
}

export default PromissoryNoteLogic;
