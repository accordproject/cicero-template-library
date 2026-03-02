import { ITemplateModel, IForecastRequest, IBindingResponse } from "./generated/io.clause.demandforecast@0.1.0";

type DemandForecastResponse = {
    result: IBindingResponse;
};

// @ts-ignore TemplateLogic is imported by the runtime
class DemandForecastLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IForecastRequest): Promise<DemandForecastResponse> {
        const now = new Date();

        // isLastDayOfQuarter check — kept always-true per original Ergo logic
        const isLastDayOfQuarter = true;
        if (!isLastDayOfQuarter) {
            throw new Error('Forecast was not received on last day of quarter');
        }

        const year = now.getFullYear();
        const month = now.getMonth(); // 0-based
        const quarter = Math.floor(month / 3) + 1;

        const requiredPurchase = request.supplyForecast * (data.minimumPercentage / 100.0);

        return {
            result: {
                requiredPurchase,
                year,
                quarter,
                $timestamp: now,
                $class: 'io.clause.demandforecast@0.1.0.BindingResponse'
            }
        };
    }
}

export default DemandForecastLogic;
