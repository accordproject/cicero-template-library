import { IMyRequest, IMyResponse, ITemplateModel } from "./generated/io.clause.helloworld@0.1.0";

type HelloWorldResponse = {
    result: IMyResponse;
}

// @ts-ignore
class HelloWorldLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IMyRequest): Promise<HelloWorldResponse> {
        return {
            result: {
                output: `Hello ${data.name} ${request.input}`,
                $timestamp: new Date(),
                $class: 'io.clause.helloworld@0.1.0.MyResponse'
            }
        };
    }
}

export default HelloWorldLogic;
