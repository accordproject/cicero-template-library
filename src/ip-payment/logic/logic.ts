import { ITemplateModel, IPaymentRequest, IPayOut } from './generated/org.accordproject.ippayment@0.2.0';
import type { IDuration } from './generated/org.accordproject.time@0.3.0';
import { IMonetaryAmount, CurrencyCode } from './generated/org.accordproject.money@0.3.0';

function monetary(doubleValue: number, currencyCode: CurrencyCode): IMonetaryAmount {
    return {
        $class: 'org.accordproject.money@0.3.0.MonetaryAmount',
        doubleValue,
        currencyCode,
    };
}

type DurationUnit = IDuration['unit'];

const TemporalUnit = {
    seconds: 'seconds' as DurationUnit,
    minutes: 'minutes' as DurationUnit,
    hours: 'hours' as DurationUnit,
    days: 'days' as DurationUnit,
    weeks: 'weeks' as DurationUnit,
};

type IPPaymentResponse = {
    result: IPayOut;
};

// @ts-ignore TemplateLogic is injected by the runtime
class IPPaymentLogic extends TemplateLogic<ITemplateModel> {

    private addDuration(date: Date, duration: IDuration): Date {
        const result = new Date(date.getTime());
        switch (duration.unit) {
            case TemporalUnit.days:    result.setDate(result.getDate() + duration.amount); break;
            case TemporalUnit.weeks:   result.setDate(result.getDate() + duration.amount * 7); break;
            case TemporalUnit.hours:   result.setHours(result.getHours() + duration.amount); break;
            case TemporalUnit.minutes: result.setMinutes(result.getMinutes() + duration.amount); break;
            case TemporalUnit.seconds: result.setSeconds(result.getSeconds() + duration.amount); break;
            default: throw new Error(`Unsupported temporal unit: ${duration.unit}`);
        }
        return result;
    }

    private endOfQuarter(date: Date): Date {
        const month = date.getMonth();
        const quarterEndMonth = Math.floor(month / 3) * 3 + 2;
        return new Date(date.getFullYear(), quarterEndMonth + 1, 0, 23, 59, 59, 999);
    }

    async trigger(data: ITemplateModel, request: IPaymentRequest): Promise<IPPaymentResponse> {
        const netSaleRevenue = request.netSaleRevenue;
        const sublicensingRevenue = request.sublicensingRevenue;
        const royaltiesAmount = netSaleRevenue.doubleValue * data.royaltyRate / 100.0;
        const sublicensingAmount = sublicensingRevenue.doubleValue * data.sublicensingRoyaltyRate / 100.0;
        const totalAmountValue = royaltiesAmount + sublicensingAmount;

        let dueBy: Date;
        if (request.permissionGrantedBy) {
            dueBy = this.addDuration(new Date(request.permissionGrantedBy), data.paymentPeriodWithPermission as IDuration);
        } else {
            dueBy = this.addDuration(this.endOfQuarter(new Date()), data.paymentPeriod as IDuration);
        }

        return {
            result: {
                $class: 'org.accordproject.ippayment@0.2.0.PayOut',
                $timestamp: new Date().toISOString() as unknown as Date,
                totalAmount: monetary(totalAmountValue, netSaleRevenue.currencyCode),
                // NOTE: IPayOut types `dueBy` as `Date` for TS convenience, but the
                // runtime serializer populates DateTime fields from JSON and expects
                // an ISO-8601 string here, not a Date instance (see ValidationException
                // "Expected value at path $.dueBy to be of type DateTime"). Cast to
                // satisfy the generated type while keeping the runtime-correct value.
                dueBy: dueBy.toISOString() as unknown as Date,
            },
        };
    }
}

export default IPPaymentLogic;