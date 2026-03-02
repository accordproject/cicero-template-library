import {
    ITemplateModel,
    ISupplyAgreementState,
    ISensorReading,
    ISensorReadingData,
    ICheckContract,
    IDeliveryResponse,
} from './generated/io.clause.supplyagreementloc@0.1.0';

// @ts-expect-error EngineResponse is injected by the runtime
interface SupplyAgreementLocResponse extends EngineResponse<ISupplyAgreementState> {
    result: IDeliveryResponse;
    state: object;
    events: object[];
}

// @ts-ignore TemplateLogic is injected by the runtime
class SupplyAgreementLocLogic extends TemplateLogic<ITemplateModel, ISupplyAgreementState> {

    // @ts-expect-error InitResponse is injected by the runtime
    async init(data: ITemplateModel): Promise<InitResponse<ISupplyAgreementState>> {
        return {
            state: {
                $class: 'io.clause.supplyagreementloc@0.1.0.SupplyAgreementState',
                $identifier: data.$identifier,
                sensorReadings: [],
            }
        };
    }

    async trigger(
        data: ITemplateModel,
        request: ISensorReading | ICheckContract,
        state: ISupplyAgreementState
    ): Promise<SupplyAgreementLocResponse> {
        const requestClass = request.$class;
        const now = new Date();

        if (requestClass === 'io.clause.supplyagreementloc@0.1.0.SensorReading') {
            const reading = request as ISensorReading;
            const readingData: ISensorReadingData = {
                $class: 'io.clause.supplyagreementloc@0.1.0.SensorReadingData',
                temperature: reading.temperature,
                humidity: reading.humidity,
                readingTime: now,
            };
            const updatedReadings = [...state.sensorReadings, readingData];

            const newState: ISupplyAgreementState = {
                $class: 'io.clause.supplyagreementloc@0.1.0.SupplyAgreementState',
                $identifier: state.$identifier,
                sensorReadings: updatedReadings,
            };

            return {
                result: {
                    $class: 'io.clause.supplyagreementloc@0.1.0.DeliveryResponse',
                    $timestamp: now,
                    $identifier: state.$identifier,
                    message: 'Sensor reading received',
                    inGoodOrder: true,
                },
                state: newState,
                events: [],
            };
        } else if (requestClass === 'io.clause.supplyagreementloc@0.1.0.CheckContract') {
            const executionDate = new Date(data.executionDate);
            const elapsedMs = now.getTime() - executionDate.getTime();
            // Convert elapsed time to hours, then days
            const elapsedHours = elapsedMs / (1000 * 60 * 60);
            const numberOfDays = elapsedHours / 24;
            // Required readings: 10 readings per day based on sensorReadingFrequency
            const requiredReadingCount = numberOfDays * data.sensorReadingFrequency;
            const actualReadings = state.sensorReadings.length;
            const sufficientReadings = actualReadings >= requiredReadingCount;

            const message = sufficientReadings
                ? 'Delivery is in good order'
                : `Insufficient sensor readings. Received ${actualReadings} readings. Required: ${Math.ceil(requiredReadingCount)}`;

            return {
                result: {
                    $class: 'io.clause.supplyagreementloc@0.1.0.DeliveryResponse',
                    $timestamp: now,
                    $identifier: state.$identifier,
                    message,
                    inGoodOrder: sufficientReadings,
                },
                state,
                events: [],
            };
        } else {
            throw new Error(`Unknown request type: ${requestClass}`);
        }
    }
}

export default SupplyAgreementLocLogic;
