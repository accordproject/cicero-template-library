import { IMyRequest, IMyResponse, ITemplateModel } from "./generated/org.accordproject.salescontractru@0.1.0";

type SalesContractRuResponse = {
    result: IMyResponse;
};

// @ts-ignore
class SalesContractRuLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IMyRequest): Promise<SalesContractRuResponse> {
        return {
            result: {
                output: request.input,
                $timestamp: new Date(),
                $class: 'org.accordproject.salescontractru@0.1.0.MyResponse'
            }
        };
    }
}

export default SalesContractRuLogic;
