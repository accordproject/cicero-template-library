import { ITemplateModel, IFixedInterestsStaticRequest, IFixedInterestsStaticResponse } from "./generated/io.clause.fixedinterestsstatic@0.1.0";

type FixedInterestsStaticResponse = {
    result: IFixedInterestsStaticResponse;
};

// @ts-ignore TemplateLogic is imported by the runtime
class FixedInterestsStaticLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IFixedInterestsStaticRequest): Promise<FixedInterestsStaticResponse> {
        return {
            result: {
                output: `loan for the amount of ${data.loanAmount}`,
                $timestamp: new Date(),
                $class: 'io.clause.fixedinterestsstatic@0.1.0.FixedInterestsStaticResponse'
            }
        };
    }
}

export default FixedInterestsStaticLogic;
