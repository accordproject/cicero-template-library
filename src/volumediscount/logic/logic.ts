import { ITemplateModel, IVolumeDiscountRequest, IVolumeDiscountResponse } from './generated/io.clause.volumediscount@0.1.0';

type VolumeDiscountResult = {
    result: IVolumeDiscountResponse;
};

// @ts-ignore TemplateLogic is injected by the runtime
class VolumeDiscountLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IVolumeDiscountRequest): Promise<VolumeDiscountResult> {
        let discountRate: number;
        if (request.netAnnualChargeVolume < data.firstVolume) {
            discountRate = data.firstRate;
        } else if (request.netAnnualChargeVolume < data.secondVolume) {
            discountRate = data.secondRate;
        } else {
            discountRate = data.thirdRate;
        }
        return {
            result: {
                $class: 'io.clause.volumediscount@0.1.0.VolumeDiscountResponse',
                $timestamp: new Date(),
                discountRate,
            },
        };
    }
}

export default VolumeDiscountLogic;
