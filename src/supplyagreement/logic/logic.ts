import {
    ITemplateModel,
    IAgreementState,
    IForecastRequest,
    IForecastResponse,
    IPurchaseRequest,
    IPurchaseResponse,
    IDeliveryRequest,
    IDeliveryResponse,
    IProduct,
    IOrderItem,
    IPurchaseObligationData,
    IDeliveryObligationData,
    IPurchaseObligationEvent,
    IDeliveryObligationEvent,
    IPaymentObligationEvent,
} from './generated/io.clause.supplyagreement@0.1.0';

// @ts-expect-error EngineResponse is injected by the runtime
interface SupplyAgreementResponse extends EngineResponse<IAgreementState> {
    result: IForecastResponse | IPurchaseResponse | IDeliveryResponse;
    state: object;
    events: object[];
}

// @ts-ignore TemplateLogic is injected by the runtime
class SupplyAgreementLogic extends TemplateLogic<ITemplateModel, IAgreementState> {

    // @ts-expect-error InitResponse is injected by the runtime
    async init(data: ITemplateModel): Promise<InitResponse<IAgreementState>> {
        return {
            state: {
                $class: 'io.clause.supplyagreement@0.1.0.AgreementState',
                $identifier: data.$identifier,
                purchaseObligation: undefined,
                deliveryObligation: undefined,
                paymentObligation: undefined,
            }
        };
    }

    /**
     * Compute the total price of a set of products
     */
    private purchaseOrderPrice(products: IProduct[]): number {
        return products.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
    }

    /**
     * Get the current quarter (1-4) from a date
     */
    private getQuarter(date: Date): number {
        return Math.floor(date.getMonth() / 3) + 1;
    }

    async trigger(
        data: ITemplateModel,
        request: IForecastRequest | IPurchaseRequest | IDeliveryRequest,
        state: IAgreementState
    ): Promise<SupplyAgreementResponse> {
        const requestClass = request.$class;

        if (requestClass === 'io.clause.supplyagreement@0.1.0.ForecastRequest') {
            return this.demandForecast(data, request as IForecastRequest, state);
        } else if (requestClass === 'io.clause.supplyagreement@0.1.0.PurchaseRequest') {
            return this.purchase(data, request as IPurchaseRequest, state);
        } else if (requestClass === 'io.clause.supplyagreement@0.1.0.DeliveryRequest') {
            return this.delivery(data, request as IDeliveryRequest, state);
        } else {
            throw new Error(`Unknown request type: ${requestClass}`);
        }
    }

    private async demandForecast(
        data: ITemplateModel,
        request: IForecastRequest,
        state: IAgreementState
    ): Promise<SupplyAgreementResponse> {
        const now = new Date();

        if (data.effectiveDate >= now) {
            throw new Error('Forecast was received before the effective date');
        }

        const requiredPurchase = request.supplyForecast * (data.minimumPercentage / 100.0);
        const year = now.getFullYear();
        const quarter = this.getQuarter(now);

        const purchaseObligation: IPurchaseObligationData = {
            $class: 'io.clause.supplyagreement@0.1.0.PurchaseObligationData',
            party: data.buyer,
            requiredPurchase,
            year,
            quarter,
        };

        const newState: IAgreementState = {
            $class: 'io.clause.supplyagreement@0.1.0.AgreementState',
            $identifier: state.$identifier,
            purchaseObligation,
            deliveryObligation: undefined,
            paymentObligation: undefined,
        };

        const event: IPurchaseObligationEvent = {
            $class: 'io.clause.supplyagreement@0.1.0.PurchaseObligationEvent',
            $timestamp: now,
            party: data.buyer,
            requiredPurchase,
            year,
            quarter,
        };

        return {
            result: {
                $class: 'io.clause.supplyagreement@0.1.0.ForecastResponse',
                $timestamp: now,
            },
            state: newState,
            events: [event],
        };
    }

    private async purchase(
        data: ITemplateModel,
        request: IPurchaseRequest,
        state: IAgreementState
    ): Promise<SupplyAgreementResponse> {
        if (!state.purchaseObligation) {
            throw new Error('Cannot purchase without having submitted a demand forecast');
        }

        const now = new Date();
        const orderItems: IOrderItem[] = request.purchaseOrder.products.map(p => ({
            $class: 'io.clause.supplyagreement@0.1.0.OrderItem',
            partNumber: p.name,
            quantity: p.quantity,
        }));

        const deliveryObligation: IDeliveryObligationData = {
            $class: 'io.clause.supplyagreement@0.1.0.DeliveryObligationData',
            party: data.supplier,
            expectedDelivery: request.purchaseOrder.deliveryDate,
            deliverables: orderItems,
        };

        const newState: IAgreementState = {
            $class: 'io.clause.supplyagreement@0.1.0.AgreementState',
            $identifier: state.$identifier,
            purchaseObligation: undefined,
            deliveryObligation,
            paymentObligation: undefined,
        };

        const event: IDeliveryObligationEvent = {
            $class: 'io.clause.supplyagreement@0.1.0.DeliveryObligationEvent',
            $timestamp: now,
            party: data.supplier,
            expectedDelivery: request.purchaseOrder.deliveryDate,
            deliverables: orderItems,
        };

        return {
            result: {
                $class: 'io.clause.supplyagreement@0.1.0.PurchaseResponse',
                $timestamp: now,
            },
            state: newState,
            events: [event],
        };
    }

    private async delivery(
        data: ITemplateModel,
        request: IDeliveryRequest,
        state: IAgreementState
    ): Promise<SupplyAgreementResponse> {
        if (!state.deliveryObligation) {
            throw new Error('Cannot deliver without having submitted a purchase order');
        }

        const now = new Date();
        const amount = this.purchaseOrderPrice(request.products);

        const paymentObligation = {
            $class: 'io.clause.supplyagreement@0.1.0.PaymentObligationData',
            party: data.buyer,
            amount,
        };

        const newState: IAgreementState = {
            $class: 'io.clause.supplyagreement@0.1.0.AgreementState',
            $identifier: state.$identifier,
            purchaseObligation: undefined,
            deliveryObligation: undefined,
            paymentObligation,
        };

        const event: IPaymentObligationEvent = {
            $class: 'io.clause.supplyagreement@0.1.0.PaymentObligationEvent',
            $timestamp: now,
            party: data.buyer,
            amount,
        };

        return {
            result: {
                $class: 'io.clause.supplyagreement@0.1.0.DeliveryResponse',
                $timestamp: now,
            },
            state: newState,
            events: [event],
        };
    }
}

export default SupplyAgreementLogic;
