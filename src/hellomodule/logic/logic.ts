import { ITemplateModel, IMyRequest, IMyResponse } from './generated/org.accordproject.hellomodule@0.1.0';

type HelloModuleResponse = {
    result: IMyResponse;
};

const PI = Math.PI;

function radiansToDegrees(radians: number): number {
    return (radians * 180.0) / PI;
}

// @ts-ignore TemplateLogic is injected by the runtime
class HelloModuleLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IMyRequest): Promise<HelloModuleResponse> {
        const degrees = radiansToDegrees(PI / 2.0);
        return {
            result: {
                $class: 'org.accordproject.hellomodule@0.1.0.MyResponse',
                $timestamp: new Date(),
                output: `Hello ${data.name} (${request.input}) [motd: PI/2.0 radians is ${degrees} degrees]`,
            },
        };
    }
}

export default HelloModuleLogic;
