import type {
    ITemplateModel,
    IInstallment,
    IClosingPayment,
    IBalance,
    IInstallmentSaleState,
    IInstallmentSalePaymentEvent,
} from "./generated/org.accordproject.installmentsale@0.2.0";
import type { IMonetaryAmount } from "./generated/org.accordproject.money@0.3.0";

const NS = 'org.accordproject.installmentsale@0.2.0';
const MONEY_NS = 'org.accordproject.money@0.3.0.MonetaryAmount';
const ContractStatus = {
    WaitingForFirstDayOfNextMonth: 'WaitingForFirstDayOfNextMonth' as IInstallmentSaleState['status'],
    Fulfilled: 'Fulfilled' as IInstallmentSaleState['status'],
};

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

function makeAmount(doubleValue: number, source: IMonetaryAmount): IMonetaryAmount {
    return {
        $class: MONEY_NS,
        doubleValue,
        currencyCode: source.currencyCode,
    };
}

function assertCurrency(currencyCode: IMonetaryAmount['currencyCode'], amounts: IMonetaryAmount[]): void {
    if (amounts.some(amount => amount.currencyCode !== currencyCode)) {
        throw new Error('All installment sale monetary amounts must use the same currency.');
    }
}

// @ts-ignore TemplateLogic is imported by the runtime
class InstallmentSaleLogic extends TemplateLogic<ITemplateModel, IInstallmentSaleState> {

    // @ts-expect-error InitResponse is imported by the runtime
    async init(data: ITemplateModel): Promise<InitResponse<IInstallmentSaleState>> {
        assertCurrency(data.INITIAL_DUE.currencyCode, [
            data.TOTAL_DUE_BEFORE_CLOSING,
            data.MIN_PAYMENT,
            data.DUE_AT_CLOSING,
        ]);
        return {
            state: {
                $class: `${NS}.InstallmentSaleState`,
                $identifier: data.$identifier,
                status: ContractStatus.WaitingForFirstDayOfNextMonth,
                balance_remaining: makeAmount(data.INITIAL_DUE.doubleValue, data.INITIAL_DUE),
                next_payment_month: data.FIRST_MONTH,
                total_paid: makeAmount(0.0, data.MIN_PAYMENT)
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
        assertCurrency(data.INITIAL_DUE.currencyCode, [
            data.TOTAL_DUE_BEFORE_CLOSING,
            data.MIN_PAYMENT,
            data.DUE_AT_CLOSING,
            state.balance_remaining,
            state.total_paid,
            request.amount,
        ]);
        if (data.MIN_PAYMENT.doubleValue > state.balance_remaining.doubleValue) {
            throw new Error('Payment cannot be made. The balance remaining is less than the minimum payment amount.');
        }
        if (state.next_payment_month >= 23) {
            throw new Error('The payment is due within 24 months, please pay the last installment instead.');
        }
        if (request.amount.doubleValue < data.MIN_PAYMENT.doubleValue) {
            throw new Error('Underpaying is forbidden.');
        }
        if (request.amount.doubleValue > state.balance_remaining.doubleValue) {
            throw new Error('Overpaying is forbidden.');
        }

        const before_interest = roundn(state.balance_remaining.doubleValue - request.amount.doubleValue, 2);
        const balanceValue = roundn(before_interest * (1.0 + data.INTEREST_RATE / 100.0), 2);
        const total_paidValue = roundn(state.total_paid.doubleValue + request.amount.doubleValue, 2);

        const balance = makeAmount(balanceValue, request.amount);
        const total_paid = makeAmount(total_paidValue, request.amount);

        const newState: IInstallmentSaleState = {
            $class: `${NS}.InstallmentSaleState`,
            $identifier: state.$identifier,
            status: ContractStatus.WaitingForFirstDayOfNextMonth,
            balance_remaining: balance,
            total_paid,
            next_payment_month: state.next_payment_month + 1
        };

        const event: IInstallmentSalePaymentEvent = {
            $class: `${NS}.InstallmentSalePaymentEvent`,
            $timestamp: new Date(),
            amount: request.amount,
            description: `${data.BUYER} should pay installment to ${data.SELLER}`
        };

        return {
            result: {
                balance,
                balanceCurrency: request.amount.currencyCode,
                total_paid,
                totalPaidCurrency: request.amount.currencyCode,
                $timestamp: new Date(),
                $class: `${NS}.Balance`
            },
            state: newState,
            events: [event]
        };
    }

    private async payLastInstallment(
        data: ITemplateModel,
        request: IClosingPayment,
        state: IInstallmentSaleState
    ): Promise<InstallmentSaleContractResponse> {
        assertCurrency(data.INITIAL_DUE.currencyCode, [
            data.TOTAL_DUE_BEFORE_CLOSING,
            data.MIN_PAYMENT,
            data.DUE_AT_CLOSING,
            state.balance_remaining,
            state.total_paid,
            request.amount,
        ]);
        const expectedPayment = roundn(state.balance_remaining.doubleValue + data.DUE_AT_CLOSING.doubleValue, 2);
        if (roundn(request.amount.doubleValue, 2) !== expectedPayment) {
            throw new Error('The last installment payment should be equal to the sum of remaining balance plus the amount due at closing.');
        }

        const balanceValue = 0.0;
        const total_paidValue = state.total_paid.doubleValue + request.amount.doubleValue;

        const balance = makeAmount(balanceValue, request.amount);
        const total_paid = makeAmount(total_paidValue, request.amount);

        const newState: IInstallmentSaleState = {
            $class: `${NS}.InstallmentSaleState`,
            $identifier: state.$identifier,
            status: ContractStatus.Fulfilled,
            balance_remaining: balance,
            total_paid,
            next_payment_month: 0
        };

        const event: IInstallmentSalePaymentEvent = {
            $class: `${NS}.InstallmentSalePaymentEvent`,
            $timestamp: new Date(),
            amount: request.amount,
            description: `${data.BUYER} should pay installment to ${data.SELLER}`
        };

        return {
            result: {
                balance,
                balanceCurrency: request.amount.currencyCode,
                total_paid,
                totalPaidCurrency: request.amount.currencyCode,
                $timestamp: new Date(),
                $class: `${NS}.Balance`
            },
            state: newState,
            events: [event]
        };
    }
}

export default InstallmentSaleLogic;
