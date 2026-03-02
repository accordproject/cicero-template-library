// @ts-nocheck - Suppress type checking for runtime mocks
declare global {
    var TemplateLogic: any;
}

// Mock runtime globals BEFORE importing logic
(global as any).TemplateLogic = class TemplateLogic<T> {
    async trigger(data: T, request: any): Promise<any> { return {}; }
};

// Import AFTER mocks are set up
import InterestRateSwapLogic from './logic';
import { ITemplateModel, IRateObservation } from './generated/io.clause.isda.irs@0.1.0';

const NS = 'io.clause.isda.irs@0.1.0';

describe('InterestRateSwapLogic', () => {
    let logic: InterestRateSwapLogic;
    let model: ITemplateModel;

    beforeEach(() => {
        logic = new InterestRateSwapLogic();
        model = {
            $class: `${NS}.TemplateModel`,
            $identifier: 'test-id',
            clauseId: 'test-id',
            bank: 'Bank A',
            letterDate: new Date('2018-01-01T00:00:00Z'),
            counterparty: 'Counterparty B',
            bankReference: 'REF-001',
            notionalAmount: 1000000.0,
            notionalCurrency: 'USD',
            tradeDate: new Date('2018-01-01T00:00:00Z'),
            effectiveDate: new Date('2018-01-03T00:00:00Z'),
            terminationDate: new Date('2021-01-03T00:00:00Z'),
            fixedRatePayer: 'Bank A',
            fixedRatePayerPeriodEndDates: 'Each 3 January',
            fixedRatePayerPaymentDates: 'Each 3 January',
            fixedRate: 1.5,
            fixedRateDayCountFraction: { $class: `${NS}.DayCountFraction`, value: '30/360' },
            fixedRatePayerBusinessDays: 'London',
            fixedRatePayerBusinessDayConvention: 'Following',
            floatingRatePayer: 'Counterparty B',
            floatingRatePayerPeriodEndDates: 'Each 3 January',
            floatingRatePayerPaymentDates: 'Each 3 January',
            floatingRateForInitialCalculationPeriod: 1.0,
            floatingRateOption: 'USD-LIBOR-BBA',
            designatedMaturity: '3 months',
            spread: '0.0',
            floatingRateDayCountFraction: { $class: `${NS}.DayCountFraction`, value: 'Actual/360' },
            resetDates: 'First Business Day of each Calculation Period',
            compounding: 'Inapplicable',
            floatingRatePayerBusinessDays: 'London',
            floatingRatePayerBusinessDayConvention: 'Following'
        };
    });

    describe('trigger', () => {
        it('should return a result with outstanding balance', async () => {
            const request: IRateObservation = {
                $class: `${NS}.RateObservation`,
                $timestamp: new Date()
            };
            const result = await logic.trigger(model, request);

            expect(result.result).toHaveProperty('$class', `${NS}.Result`);
            expect(result.result).toHaveProperty('$timestamp');
            expect(result.result.outstandingBalance).toBe(10.0);
        });

        it('should throw when fixedRate is negative', async () => {
            model.fixedRate = -1.0;
            const request: IRateObservation = {
                $class: `${NS}.RateObservation`,
                $timestamp: new Date()
            };
            await expect(logic.trigger(model, request)).rejects.toThrow('Fixed rate cannot be negative');
        });

        it('should throw when notionalAmount is negative', async () => {
            model.notionalAmount = -1000.0;
            const request: IRateObservation = {
                $class: `${NS}.RateObservation`,
                $timestamp: new Date()
            };
            await expect(logic.trigger(model, request)).rejects.toThrow('Notional amount cannot be negative');
        });
    });
});
