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

import HelloWorldStateLogic from './logic';
import { ITemplateModel, IMyRequest } from './generated/io.clause.helloworldstate@0.1.0';

describe('HelloWorldStateLogic', () => {
    let logic: HelloWorldStateLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new HelloWorldStateLogic();
        model = {
            $class: 'io.clause.helloworldstate@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            name: 'World',
        };
    });

    describe('init', () => {
        it('should initialize counter to 0', async () => {
            const result = await logic.init(model);
            expect((result.state as any).counter).toBe(0);
            expect((result.state as any).$class).toBe('io.clause.helloworldstate@0.1.0.HelloWorldState');
        });
    });

    describe('trigger', () => {
        it('should return a greeting with the current counter value', async () => {
            const request: IMyRequest = {
                $class: 'io.clause.helloworldstate@0.1.0.MyRequest',
                $timestamp: new Date(),
                input: 'Accord Project',
            };
            const state = { $class: 'io.clause.helloworldstate@0.1.0.HelloWorldState', $identifier: 'test-id', counter: 0 };
            const result = await logic.trigger(model, request, state);
            expect(result.result.output).toContain('Hello World Accord Project');
            expect(result.result.output).toContain('0');
        });

        it('should increment the counter after each trigger', async () => {
            const request: IMyRequest = {
                $class: 'io.clause.helloworldstate@0.1.0.MyRequest',
                $timestamp: new Date(),
                input: 'test',
            };
            const state = { $class: 'io.clause.helloworldstate@0.1.0.HelloWorldState', $identifier: 'test-id', counter: 5 };
            const result = await logic.trigger(model, request, state);
            expect((result.state as any).counter).toBe(6);
        });
    });
});
