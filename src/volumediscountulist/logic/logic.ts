import { ITemplateModel, IVolumeDiscountRequest, IVolumeDiscountResponse, IRateRange } from './generated/org.accordproject.volumediscountulist@0.1.0';

type VolumeDiscountResult = {
    result: IVolumeDiscountResponse;
};

// @ts-ignore TemplateLogic is injected by the runtime
class VolumeDiscountUListLogic extends TemplateLogic<ITemplateModel> {

    private findRate(volume: number, rateTable: IRateRange[]): number | undefined {
        const match = rateTable.find(r => volume > r.volumeAbove && volume <= r.volumeUpTo);
        return match ? match.rate : undefined;
    }

    async trigger(data: ITemplateModel, request: IVolumeDiscountRequest): Promise<VolumeDiscountResult> {
        const rate = this.findRate(request.netAnnualChargeVolume, data.rates);
        if (rate === undefined) {
            throw new Error('Could not find rate for that volume');
        }
        return {
            result: {
                $class: 'org.accordproject.volumediscountulist@0.1.0.VolumeDiscountResponse',
                $timestamp: new Date(),
                discountRate: rate,
            },
        };
    }
}

export default VolumeDiscountUListLogic;
