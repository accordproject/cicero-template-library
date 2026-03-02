// @ts-nocheck
declare global {
    var TemplateLogic: any;
    var EngineResponse: any;
    var InitResponse: any;
}
(global as any).TemplateLogic = class TemplateLogic<T, S> {
    async trigger(data: T, request: any, state?: S): Promise<any> { return {}; }
};
(global as any).EngineResponse = class EngineResponse<S> {};
(global as any).InitResponse = class InitResponse<S> {};

import HelloWorldLogic from './logic';
import { ITemplateModel, IMyRequest } from './generated/org.accordproject.helloworld@0.1.0';

describe('HelloWorldLogic', () => {
    let logic: HelloWorldLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new HelloWorldLogic();
        model = {
            $class: 'org.accordproject.helloworld@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            name: 'World',
        };
    });

    describe('trigger', () => {
        it('should return a greeting with name and input', async () => {
            const request: IMyRequest = {
                $class: 'org.accordproject.helloworld@0.1.0.MyRequest',
                $timestamp: new Date(),
                input: 'Accord Project',
            };
            const response = await logic.trigger(model, request);
            expect(response.result.output).toBe('Hello World Accord Project');
            expect(response.result.$class).toBe('org.accordproject.helloworld@0.1.0.MyResponse');
            expect(response.result.$timestamp).toBeInstanceOf(Date);
        });

        it('should include the name from template data', async () => {
            model.name = 'Alice';
            const request: IMyRequest = {
                $class: 'org.accordproject.helloworld@0.1.0.MyRequest',
                $timestamp: new Date(),
                input: 'everyone',
            };
            const response = await logic.trigger(model, request);
            expect(response.result.output).toBe('Hello Alice everyone');
        });
    });
});
