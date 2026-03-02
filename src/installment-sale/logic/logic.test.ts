// @ts-nocheck - Suppress type checking for runtime mocks
declare global {
    var TemplateLogic: any;
    var EngineResponse: any;
    var InitResponse: any;
}

// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T, S> {
    async init(data: T): Promise<any> { return { state: {} }; }
    async trigger(data: T, request: any, state: S): Promise<any> { return {}; }
};
(global as any).EngineResponse = class EngineResponse<S> {};
(global as any).InitResponse = class InitResponse<S> {};

// Import AFTER mocks are set up
import InstallmentSaleLogic from './logic';
import {
    ITemplateModel,
    IInstallment,
    IClosingPayment,
    IInstallmentSaleState,
    ContractStatus
} from './generated/org.accordproject.installmentsale@0.1.0';

const NS = 'org.accordproject.installmentsale@0.1.0';

describe('InstallmentSaleLogic', () => {
    let logic: InstallmentSaleLogic;
    let model: ITemplateModel;
    let initialState: IInstallmentSaleState;

    beforeEach(() => {
        logic = new InstallmentSaleLogic();
        model = {
            $class: `${NS}.TemplateModel`,
            $identifier: 'test-id',
            clauseId: 'test-id',
            BUYER: 'Dan',
            SELLER: 'Ned',
            INITIAL_DUE: 10000.0,
            CURRENCY_CODE: 'EUR',
            INTEREST_RATE: 1.5,
            TOTAL_DUE_BEFORE_CLOSING: 9500.0,
            MIN_PAYMENT: 500.0,
            DUE_AT_CLOSING: 500.0,
            FIRST_MONTH: 3
        };
        initialState = {
            $class: `${NS}.InstallmentSaleState`,
            $identifier: 'test-id',
            status: ContractStatus.WaitingForFirstDayOfNextMonth,
            balance_remaining: 10000.0,
            currencyCode: 'EUR',
            next_payment_month: 3,
            total_paid: 0.0
        };
    });

    describe('init', () => {
        it('should initialise state with INITIAL_DUE as balance', async () => {
            const result = await logic.init(model);
            expect(result.state).toMatchObject({
                $class: `${NS}.InstallmentSaleState`,
                $identifier: 'test-id',
                status: ContractStatus.WaitingForFirstDayOfNextMonth,
                balance_remaining: 10000.0,
                total_paid: 0.0
            });
        });
    });

    describe('trigger - PayInstallment', () => {
        it('should process a valid installment payment', async () => {
            const request: IInstallment = {
                $class: `${NS}.Installment`,
                $timestamp: new Date(),
                amount: 2500.0,
                currencyCode: 'EUR'
            };
            const result = await logic.trigger(model, request, initialState);

            expect(result.result).toHaveProperty('$class', `${NS}.Balance`);
            expect(result.result.total_paid).toBeCloseTo(2500.0, 2);
            expect(result.result.balance).toBeLessThan(10000.0);
            expect(Array.isArray(result.events)).toBe(true);
            expect(result.events).toHaveLength(1);
        });

        it('should throw when payment is less than minimum', async () => {
            const request: IInstallment = {
                $class: `${NS}.Installment`,
                $timestamp: new Date(),
                amount: 100.0,
                currencyCode: 'EUR'
            };
            await expect(logic.trigger(model, request, initialState)).rejects.toThrow('Underpaying is forbidden.');
        });

        it('should accumulate state across multiple payments', async () => {
            const request: IInstallment = {
                $class: `${NS}.Installment`,
                $timestamp: new Date(),
                amount: 2500.0,
                currencyCode: 'EUR'
            };
            const result1 = await logic.trigger(model, request, initialState);
            const result2 = await logic.trigger(model, request, result1.state as IInstallmentSaleState);

            expect(result2.result.total_paid).toBeCloseTo(5000.0, 2);
            expect((result2.state as IInstallmentSaleState).next_payment_month).toBe(5);
        });

        it('should throw when payment month is 23 or above', async () => {
            const lateState: IInstallmentSaleState = {
                ...initialState,
                next_payment_month: 23
            };
            const request: IInstallment = {
                $class: `${NS}.Installment`,
                $timestamp: new Date(),
                amount: 2500.0,
                currencyCode: 'EUR'
            };
            await expect(logic.trigger(model, request, lateState)).rejects.toThrow('please pay the last installment instead');
        });
    });

    describe('trigger - PayLastInstallment', () => {
        it('should process the final closing payment', async () => {
            // balance_remaining = 500.0 (just enough for a closing payment)
            const closeState: IInstallmentSaleState = {
                ...initialState,
                balance_remaining: 500.0,
                total_paid: 9500.0
            };
            // Closing payment = balance_remaining + DUE_AT_CLOSING = 500 + 500 = 1000
            const request: IClosingPayment = {
                $class: `${NS}.ClosingPayment`,
                $timestamp: new Date(),
                amount: 1000.0,
                currencyCode: 'EUR'
            };
            const result = await logic.trigger(model, request, closeState);

            expect(result.result.balance).toBe(0.0);
            expect((result.state as IInstallmentSaleState).status).toBe(ContractStatus.Fulfilled);
        });

        it('should throw when closing payment amount is wrong', async () => {
            const closeState: IInstallmentSaleState = {
                ...initialState,
                balance_remaining: 500.0,
                total_paid: 9500.0
            };
            const request: IClosingPayment = {
                $class: `${NS}.ClosingPayment`,
                $timestamp: new Date(),
                amount: 999.0,
                currencyCode: 'EUR'
            };
            await expect(logic.trigger(model, request, closeState)).rejects.toThrow('sum of remaining balance');
        });
    });
});
