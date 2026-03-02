import { ITemplateModel, IMyRequest, IMyResponse } from './generated/org.accordproject.helloworldstate@0.1.0';

// Inline HelloWorldState since it comes from the generated file
interface IHelloWorldState {
    $class: string;
    $identifier: string;
    counter: number;
}

// @ts-expect-error EngineResponse is injected by the runtime
interface HelloWorldStateEngineResponse extends EngineResponse<IHelloWorldState> {
    result: IMyResponse;
    state: object;
    events: object[];
}

// @ts-ignore TemplateLogic is injected by the runtime
class HelloWorldStateLogic extends TemplateLogic<ITemplateModel, IHelloWorldState> {

    // @ts-expect-error InitResponse is injected by the runtime
    async init(data: ITemplateModel): Promise<InitResponse<IHelloWorldState>> {
        return {
            state: {
                $class: 'org.accordproject.helloworldstate@0.1.0.HelloWorldState',
                $identifier: data.$identifier,
                counter: 0,
            },
        };
    }

    async trigger(
        data: ITemplateModel,
        request: IMyRequest,
        state: IHelloWorldState
    ): Promise<HelloWorldStateEngineResponse> {
        const now = new Date();
        const currentCounter = state.counter;
        return {
            result: {
                $class: 'org.accordproject.helloworldstate@0.1.0.MyResponse',
                $timestamp: now,
                output: `Hello ${data.name} ${request.input}(${currentCounter})`,
            },
            state: {
                $class: 'org.accordproject.helloworldstate@0.1.0.HelloWorldState',
                $identifier: state.$identifier,
                counter: currentCounter + 1,
            },
            events: [],
        };
    }
}

export default HelloWorldStateLogic;
