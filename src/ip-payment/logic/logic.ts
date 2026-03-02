import { ITemplateModel, IPaymentRequest, IPayOut } from './generated/io.clause.ippayment@0.1.0';

// Inline types from org.accordproject.time@0.3.0 — generated files may not be available at runtime
enum TemporalUnit {
    seconds = 'seconds',
    minutes = 'minutes',
    hours = 'hours',
    days = 'days',
    weeks = 'weeks',
}

interface IDuration {
    $class?: string;
    amount: number;
    unit: TemporalUnit;
}

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
        const royaltiesAmount = request.netSaleRevenue * data.royaltyRate / 100.0;
        const sublicensingAmount = request.sublicensingRevenue * data.sublicensingRoyaltyRate / 100.0;
        const totalAmount = royaltiesAmount + sublicensingAmount;

        let dueBy: Date;
        if (request.permissionGrantedBy) {
            dueBy = this.addDuration(new Date(request.permissionGrantedBy), data.paymentPeriodWithPermission as IDuration);
        } else {
            dueBy = this.addDuration(this.endOfQuarter(new Date()), data.paymentPeriod as IDuration);
        }

        return {
            result: {
                $class: 'io.clause.ippayment@0.1.0.PayOut',
                $timestamp: new Date(),
                totalAmount,
                dueBy,
            },
        };
    }
}

export default IPPaymentLogic;
