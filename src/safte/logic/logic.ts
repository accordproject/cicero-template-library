import {
    ITokenSale,
    ITokenShare,
    IEquityFinancing,
    IEquityShare,
    IDissolutionEvent,
    IPayOut,
    ITemplateModel
} from "./generated/org.accordproject.safte@0.1.0";

type SafteRequest = ITokenSale | IEquityFinancing | IDissolutionEvent;
type SafteResponseResult = ITokenShare | IEquityShare | IPayOut;

type SafteResponse = {
    result: SafteResponseResult;
};

// @ts-ignore
class SafteLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: SafteRequest): Promise<SafteResponse> {
        if (request.$class === 'org.accordproject.safte@0.1.0.TokenSale') {
            return this.tokenSale(data, request as ITokenSale);
        } else if (request.$class === 'org.accordproject.safte@0.1.0.EquityFinancing') {
            return this.equityFinancing(data, request as IEquityFinancing);
        } else if (request.$class === 'org.accordproject.safte@0.1.0.DissolutionEvent') {
            return this.dissolutionEvent(data, request as IDissolutionEvent);
        } else {
            throw new Error(`Unknown request type: ${(request as any).$class}`);
        }
    }

    private async tokenSale(data: ITemplateModel, request: ITokenSale): Promise<SafteResponse> {
        const discountRate = (100.0 - data.discount) / 100.0;
        const discountPrice = request.tokenPrice * discountRate;
        const tokenAmount = data.purchaseAmount / discountPrice;

        return {
            result: {
                tokenAmount,
                $timestamp: new Date(),
                $class: 'org.accordproject.safte@0.1.0.TokenShare'
            }
        };
    }

    private async equityFinancing(data: ITemplateModel, request: IEquityFinancing): Promise<SafteResponse> {
        const discountRate = (100.0 - data.discount) / 100.0;
        const discountPrice = request.sharePrice * discountRate;
        const equityAmount = data.purchaseAmount / discountPrice;

        return {
            result: {
                equityAmount,
                $timestamp: new Date(),
                $class: 'org.accordproject.safte@0.1.0.EquityShare'
            }
        };
    }

    private async dissolutionEvent(data: ITemplateModel, request: IDissolutionEvent): Promise<SafteResponse> {
        return {
            result: {
                amount: data.purchaseAmount,
                $timestamp: new Date(),
                $class: 'org.accordproject.safte@0.1.0.PayOut'
            }
        };
    }
}

export default SafteLogic;
