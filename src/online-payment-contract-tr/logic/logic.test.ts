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

import OnlinePaymentContractTRLogic from './logic';
import { ITemplateModel, IMyRequest } from './generated/org.accordproject.onlinepaymentcontracttr@0.1.0';

describe('OnlinePaymentContractTRLogic', () => {
    let logic: OnlinePaymentContractTRLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new OnlinePaymentContractTRLogic();
        model = {
            $class: 'org.accordproject.onlinepaymentcontracttr@0.1.0.TemplateModel',
            $identifier: 'test-id',
            clauseId: 'test-id',
            buyer: 'Alice',
            seller: 'Bob',
            softwareID: 'SW-001',
            userCount: 10,
            authorizedCourt: 'Istanbul',
        };
    });

    describe('trigger', () => {
        it('should echo the input as output', async () => {
            const request: IMyRequest = {
                $class: 'org.accordproject.onlinepaymentcontracttr@0.1.0.MyRequest',
                $timestamp: new Date(),
                input: 'test input',
            };
            const result = await logic.trigger(model, request);
            expect(result.result.output).toBe('test input');
            expect(result.result.$class).toBe('org.accordproject.onlinepaymentcontracttr@0.1.0.MyResponse');
        });

        it('should return a timestamp', async () => {
            const request: IMyRequest = {
                $class: 'org.accordproject.onlinepaymentcontracttr@0.1.0.MyRequest',
                $timestamp: new Date(),
                input: 'hello',
            };
            const result = await logic.trigger(model, request);
            expect(result.result.$timestamp).toBeInstanceOf(Date);
        });
    });
});
