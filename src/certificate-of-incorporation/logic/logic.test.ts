// @ts-nocheck - Suppress type checking for runtime mocks
declare global {
    var TemplateLogic: any;
    var EngineResponse: any;
    var InitResponse: any;
}

// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T, S = undefined> {
    async trigger(data: T, request: any, state?: S): Promise<any> { return {}; }
};
(global as any).EngineResponse = class EngineResponse<S> {};
(global as any).InitResponse = class InitResponse<S> {};

import CertificateOfIncorporationLogic from './logic';
import { ITemplateModel } from './generated/io.clause.certificateofincorporation@0.1.0';

describe('CertificateOfIncorporationLogic', () => {
    let logic: CertificateOfIncorporationLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new CertificateOfIncorporationLogic();

        model = {
            $class: 'io.clause.certificateofincorporation@0.1.0.TemplateModel',
            $identifier: 'test-clause-id',
            clauseId: 'test-clause-id',
            companyName: 'Acme Corp',
            incorporationState: 'Delaware',
            streetAddress: '1209 Orange Street',
            addressRegion: 'New Castle County',
            addressLocality: 'Wilmington',
            postalCode: '19801',
            registeredAgentName: 'The Corporation Trust Company',
            incorporationDate: new Date('2020-01-15T00:00:00Z'),
            authorizedShareCapital: 10000000,
            parValue: 0.0001,
            incorporatorName: 'Jane Smith',
            incorporatorAddress: '100 Main Street',
            incorporatorCity: 'New York',
            incorporatorState: 'NY',
            incorporatorZip: '10001'
        };
    });

    describe('trigger', () => {
        it('should return a response with a timestamp', async () => {
            const request = {
                $class: 'org.accordproject.signature@0.2.0.ContractSigned',
                $timestamp: new Date(),
                contract: 'MY_CONTRACT'
            };

            const result = await logic.trigger(model, request);

            expect(result.result).toBeDefined();
            expect(result.result.$class).toBeDefined();
            expect(result.result.$timestamp).toBeDefined();
        });

        it('should emit an IncorporationEvent with correct company data', async () => {
            const request = {
                $class: 'org.accordproject.signature@0.2.0.ContractSigned',
                $timestamp: new Date(),
                contract: 'MY_CONTRACT'
            };

            const result = await logic.trigger(model, request);

            expect(Array.isArray(result.events)).toBe(true);
            expect(result.events).toHaveLength(1);

            const event = result.events[0] as any;
            expect(event.$class).toBe('io.clause.certificateofincorporation@0.1.0.IncorporationEvent');
            expect(event.$timestamp).toBeDefined();
            expect(event.companyName).toBe('Acme Corp');
            expect(event.authorizedShareCapital).toBe(10000000);
            expect(event.parValue).toBe(0.0001);
        });

        it('should emit event with the incorporation date from the template data', async () => {
            const request = {
                $class: 'org.accordproject.signature@0.2.0.ContractSigned',
                $timestamp: new Date(),
                contract: 'MY_CONTRACT'
            };

            const result = await logic.trigger(model, request);
            const event = result.events[0] as any;

            expect(new Date(event.incorporationDate).toISOString())
                .toBe(new Date('2020-01-15T00:00:00Z').toISOString());
        });

        it('should reflect different company data in the event', async () => {
            model.companyName = 'Beta LLC';
            model.authorizedShareCapital = 5000000;

            const request = {
                $class: 'org.accordproject.signature@0.2.0.ContractSigned',
                $timestamp: new Date(),
                contract: 'MY_CONTRACT'
            };

            const result = await logic.trigger(model, request);
            const event = result.events[0] as any;

            expect(event.companyName).toBe('Beta LLC');
            expect(event.authorizedShareCapital).toBe(5000000);
        });
    });
});
