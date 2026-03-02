import { ILaunch, ITerminate, IPayout, ITemplateModel } from "./generated/org.accordproject.saft@0.1.0";

type SaftRequest = ILaunch | ITerminate;

type SaftResponse = {
    result: IPayout;
};

// @ts-ignore
class SaftLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: SaftRequest): Promise<SaftResponse> {
        if (request.$class === 'org.accordproject.saft@0.1.0.Launch') {
            return this.onLaunch(data, request as ILaunch);
        } else if (request.$class === 'org.accordproject.saft@0.1.0.Terminate') {
            return this.onTerminate(data, request as ITerminate);
        } else {
            throw new Error(`Unknown request type: ${(request as any).$class}`);
        }
    }

    private async onLaunch(data: ITemplateModel, request: ILaunch): Promise<SaftResponse> {
        return {
            result: {
                tokenAmount: 100.0,
                tokenAddress: data.purchaser,
                $timestamp: new Date(),
                $class: 'org.accordproject.saft@0.1.0.Payout'
            }
        };
    }

    private async onTerminate(data: ITemplateModel, request: ITerminate): Promise<SaftResponse> {
        return {
            result: {
                tokenAmount: 9.0,
                tokenAddress: data.purchaser,
                $timestamp: new Date(),
                $class: 'org.accordproject.saft@0.1.0.Payout'
            }
        };
    }
}

export default SaftLogic;
