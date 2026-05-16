import {
    ITemplateModel,
    IInstallment,
    IClosingPayment,
    IBalance,
    IInstallmentSaleState,
    IInstallmentSalePaymentEvent,
    ContractStatus
} from "./generated/org.accordproject.installmentsale@0.1.0";
import { IMonetaryAmount } from "./generated/org.accordproject.money@0.3.0";

function monetary(doubleValue: number, currencyCode: string): IMonetaryAmount {
    return {
        $class: 'org.accordproject.money@0.3.0.MonetaryAmount',
        doubleValue,
        currencyCode,
    };
}

const NS = 'org.accordproject.installmentsale@0.1.0';

// @ts-expect-error EngineResponse is imported by the runtime
interface InstallmentSaleContractResponse extends EngineResponse<IInstallmentSaleState> {
    result: IBalance;
    state: object;
    events: object[];
}

function roundn(x: number, n: number): number {
    const e = Math.pow(10, n);
    return Math.round(x * e) / e;
}

// @ts-ignore TemplateLogic is imported by the runtime
class InstallmentSaleLogic extends TemplateLogic<ITemplateModel, IInstallmentSaleState> {

    // @ts-expect-error InitResponse is imported by the runtime
    async init(data: ITemplateModel): Promise<InitResponse<IInstallmentSaleState>> {
        return {
            state: {
                $class: `${NS}.InstallmentSaleState`,
                $identifier: data.$identifier,
                status: ContractStatus.WaitingForFirstDayOfNextMonth,
                balance_remaining: (data.INITIAL_DUE as any).doubleValue,
                currencyCode: (data.INITIAL_DUE as any).currencyCode,
                next_payment_month: data.FIRST_MONTH,
                total_paid: 0.0
            }
        };
    }

    async trigger(
        data: ITemplateModel,
        request: IInstallment | IClosingPayment,
        state: IInstallmentSaleState
    ): Promise<InstallmentSaleContractResponse> {
        if (request.$class === `${NS}.Installment`) {
            return this.payInstallment(data, request as IInstallment, state);
        } else if (request.$class === `${NS}.ClosingPayment`) {
            return this.payLastInstallment(data, request as IClosingPayment, state);
        } else {
            throw new Error(`Unknown request type: ${request.$class}`);
        }
    }

    private async payInstallment(
        data: ITemplateModel,
        request: IInstallment,
        state: IInstallmentSaleState
    ): Promise<InstallmentSaleContractResponse> {
        const minPayment = (data.MIN_PAYMENT as any).doubleValue;
        const requestAmount = (request.amount as any).doubleValue;
        if (minPayment > state.balance_remaining) {
            throw new Error('Payment cannot be made. The balance remaining is less than the minimum payment amount.');
        }
        if (state.next_payment_month >= 23) {
            throw new Error('The payment is due within 24 months, please pay the last installment instead.');
        }
        if (requestAmount < minPayment) {
            throw new Error('Underpaying is forbidden.');
        }
        if (requestAmount > state.balance_remaining) {
            throw new Error('Overpaying is forbidden.');
        }

        const before_interest = roundn(state.balance_remaining - requestAmount, 2);
        const balance = roundn(before_interest * (1.0 + data.INTEREST_RATE / 100.0), 2);
        const total_paid = roundn(state.total_paid + requestAmount, 2);

        const currency = state.currencyCode;
        const newState: IInstallmentSaleState = {
            $class: `${NS}.InstallmentSaleState`,
            $identifier: state.$identifier,
            status: ContractStatus.WaitingForFirstDayOfNextMonth,
            balance_remaining: balance,
            currencyCode: currency,
            total_paid,
            next_payment_month: state.next_payment_month + 1
        };

        const event: IInstallmentSalePaymentEvent = {
            $class: `${NS}.InstallmentSalePaymentEvent`,
            $timestamp: new Date(),
            amount: request.amount,
            description: `${data.BUYER} should pay installment to ${data.SELLER}`
        } as any;

        return {
            result: {
                balance: monetary(balance, currency),
                total_paid: monetary(total_paid, currency),
                $timestamp: new Date(),
                $class: `${NS}.Balance`
            } as any,
            state: newState,
            events: [event]
        };
    }

    private async payLastInstallment(
        data: ITemplateModel,
        request: IClosingPayment,
        state: IInstallmentSaleState
    ): Promise<InstallmentSaleContractResponse> {
        const dueAtClosing = (data.DUE_AT_CLOSING as any).doubleValue;
        const requestAmount = (request.amount as any).doubleValue;
        const expectedPayment = roundn(state.balance_remaining + dueAtClosing, 2);
        if (roundn(requestAmount, 2) !== expectedPayment) {
            throw new Error('The last installment payment should be equal to the sum of remaining balance plus the amount due at closing.');
        }

        const balance = 0.0;
        const total_paid = state.total_paid + requestAmount;

        const currency = state.currencyCode;
        const newState: IInstallmentSaleState = {
            $class: `${NS}.InstallmentSaleState`,
            $identifier: state.$identifier,
            status: ContractStatus.Fulfilled,
            balance_remaining: balance,
            currencyCode: currency,
            total_paid,
            next_payment_month: 0
        };

        const event: IInstallmentSalePaymentEvent = {
            $class: `${NS}.InstallmentSalePaymentEvent`,
            $timestamp: new Date(),
            amount: request.amount,
            description: `${data.BUYER} should pay installment to ${data.SELLER}`
        } as any;

        return {
            result: {
                balance: monetary(balance, currency),
                total_paid: monetary(total_paid, currency),
                $timestamp: new Date(),
                $class: `${NS}.Balance`
            } as any,
            state: newState,
            events: [event]
        };
    }
}

export default InstallmentSaleLogic;
