import { IMyRequest, IMyResponse, ITemplateModel } from './generated/io.clause.onlinepaymentcontracttr@0.1.0';

type OnlinePaymentResponse = {
    result: IMyResponse;
};

// @ts-ignore TemplateLogic is injected by the runtime
class OnlinePaymentContractTRLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IMyRequest): Promise<OnlinePaymentResponse> {
        return {
            result: {
                $class: 'io.clause.onlinepaymentcontracttr@0.1.0.MyResponse',
                $timestamp: new Date(),
                output: request.input,
            },
        };
    }
}

export default OnlinePaymentContractTRLogic;
