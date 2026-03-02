// @ts-nocheck
declare global {
    var TemplateLogic: any;
    var EngineResponse: any;
    var InitResponse: any;
}
(global as any).TemplateLogic = class TemplateLogic<T, S = undefined> {
    async trigger(data: T, request: any, state?: S): Promise<any> { return {}; }
};
(global as any).EngineResponse = class EngineResponse<S> {};
(global as any).InitResponse = class InitResponse<S> {};

import HelloModuleLogic from './logic';
import { ITemplateModel, IMyRequest } from './generated/org.accordproject.hellomodule@0.1.0';

describe('HelloModuleLogic', () => {
    let logic: HelloModuleLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new HelloModuleLogic();
        model = {
            $class: 'org.accordproject.hellomodule@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            name: 'World',
        };
    });

    describe('trigger', () => {
        it('should return greeting with PI calculation', async () => {
            const request: IMyRequest = {
                $class: 'org.accordproject.hellomodule@0.1.0.MyRequest',
                $timestamp: new Date(),
                input: 'test',
            };
            const result = await logic.trigger(model, request);
            expect(result.result.output).toContain('Hello World (test)');
            expect(result.result.output).toContain('90 degrees');
            expect(result.result.$class).toBe('org.accordproject.hellomodule@0.1.0.MyResponse');
        });
    });
});
