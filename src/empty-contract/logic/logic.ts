import { IEmptyRequest, IEmptyResponse, ITemplateModel } from "./generated/org.accordproject.emptycontract@0.1.0";

type EmptyContractResponse = {
    result: IEmptyResponse;
}

// @ts-ignore
class EmptyContractLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IEmptyRequest): Promise<EmptyContractResponse> {
        return {
            result: {
                $timestamp: new Date(),
                $class: 'org.accordproject.emptycontract@0.1.0.EmptyResponse'
            }
        };
    }
}

export default EmptyContractLogic;
