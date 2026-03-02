import { IEmptyRequest, IEmptyResponse, ITemplateModel } from "./generated/io.clause.emptycontract@0.1.0";

type EmptyContractResponse = {
    result: IEmptyResponse;
}

// @ts-ignore
class EmptyContractLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IEmptyRequest): Promise<EmptyContractResponse> {
        return {
            result: {
                $timestamp: new Date(),
                $class: 'io.clause.emptycontract@0.1.0.EmptyResponse'
            }
        };
    }
}

export default EmptyContractLogic;
