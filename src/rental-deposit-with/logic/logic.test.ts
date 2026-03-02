// @ts-nocheck - Suppress type checking for runtime mocks
declare global {
    var TemplateLogic: any;
}

// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T> {
    async trigger(data: T, request: any): Promise<any> { return {}; }
};

// Import AFTER mocks are set up
import RentalDepositWithLogic from './logic';
import { ITemplateModel, IProperyInspection } from './generated/org.accordproject.rentaldepositwith@0.1.0';

const NS = 'org.accordproject.rentaldepositwith@0.1.0';

describe('RentalDepositWithLogic', () => {
    let logic: RentalDepositWithLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new RentalDepositWithLogic();
        model = {
            $class: `${NS}.TemplateModel`,
            $identifier: 'test-id',
            clauseId: 'test-id',
            tenant: { $class: `${NS}.RentalParty`, partyId: 'Alice Smith', address: '123 Main St' },
            landlord: { $class: `${NS}.RentalParty`, partyId: 'Bob Jones', address: '456 Oak Ave' },
            depositAmount: 2500.0,
            currencyCode: 'USD',
            tenantDepositRestorationPeriod: '30 days',
            monthlyBaseRentMultiple: 2.0,
            applicableLaw: 'California Civil Code',
            statute: '§1950.5',
            bankName: 'First National Bank',
            landlordDepositReturnPeriod: '21 days',
            exhibit: 'Exhibit A'
        };
    });

    describe('trigger', () => {
        it('should return full deposit when no penalties', async () => {
            const request: IProperyInspection = {
                $class: `${NS}.ProperyInspection`,
                $timestamp: new Date(),
                penalties: []
            };
            const result = await logic.trigger(model, request);

            expect(result.result).toHaveProperty('$class', `${NS}.PropertyInspectionResponse`);
            expect(result.result.balance).toBe(2500.0);
            expect(result.events).toHaveLength(1);
        });

        it('should deduct penalties from deposit', async () => {
            const request: IProperyInspection = {
                $class: `${NS}.ProperyInspection`,
                $timestamp: new Date(),
                penalties: [
                    {
                        $class: `${NS}.Penalty`,
                        description: 'Cleaning carpets',
                        amount: 1000.0,
                        currencyCode: 'USD'
                    },
                    {
                        $class: `${NS}.Penalty`,
                        description: 'Pet damage',
                        amount: 450.0,
                        currencyCode: 'USD'
                    }
                ]
            };
            const result = await logic.trigger(model, request);

            expect(result.result.balance).toBe(1050.0);
        });

        it('should preserve tenant and landlord party data', async () => {
            const request: IProperyInspection = {
                $class: `${NS}.ProperyInspection`,
                $timestamp: new Date(),
                penalties: []
            };
            // Verify model has correct party structures
            expect(model.tenant.partyId).toBe('Alice Smith');
            expect(model.landlord.address).toBe('456 Oak Ave');

            const result = await logic.trigger(model, request);
            expect(result.result.balance).toBe(2500.0);
        });
    });
});
