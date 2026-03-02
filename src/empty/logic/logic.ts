import { IEmptyRequest, IEmptyResponse, ITemplateModel } from "./generated/io.clause.empty@0.1.0";

type EmptyResponse = {
    result: IEmptyResponse;
}

// @ts-ignore
class EmptyLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IEmptyRequest): Promise<EmptyResponse> {
        return {
            result: {
                $timestamp: new Date(),
                $class: 'io.clause.empty@0.1.0.EmptyResponse'
            }
        };
    }
}

export default EmptyLogic;
