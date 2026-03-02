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

import EmptyContractLogic from './logic';
import { ITemplateModel, IEmptyRequest } from './generated/io.clause.emptycontract@0.1.0';

describe('EmptyContractLogic', () => {
    let logic: EmptyContractLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new EmptyContractLogic();
        model = {
            $class: 'io.clause.emptycontract@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
        };
    });

    describe('trigger', () => {
        it('should return an empty response', async () => {
            const request: IEmptyRequest = {
                $class: 'io.clause.emptycontract@0.1.0.EmptyRequest',
                $timestamp: new Date(),
            };
            const response = await logic.trigger(model, request);
            expect(response.result.$class).toBe('io.clause.emptycontract@0.1.0.EmptyResponse');
            expect(response.result.$timestamp).toBeInstanceOf(Date);
        });
    });
});
