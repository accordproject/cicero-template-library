import type {
    ITemplateModel,
    IInspectDeliverable,
    IInspectionResponse,
} from './generated/org.accordproject.acceptanceofdelivery@0.1.0';

type AcceptanceOfDeliveryResponse = {
    result: IInspectionResponse;
};

type InspectionStatusValue = IInspectionResponse['status'];

// The generated InspectionStatus is a TypeScript enum; its values are written here
// so that the logic does not import a value from the generated files at runtime.
const InspectionStatus = {
    PASSED_TESTING: 'PASSED_TESTING' as InspectionStatusValue,
    FAILED_TESTING: 'FAILED_TESTING' as InspectionStatusValue,
    OUTSIDE_INSPECTION_PERIOD: 'OUTSIDE_INSPECTION_PERIOD' as InspectionStatusValue,
};

// @ts-ignore TemplateLogic is injected by the runtime
class AcceptanceOfDeliveryLogic extends TemplateLogic<ITemplateModel> {

    async trigger(
        data: ITemplateModel,
        request: IInspectDeliverable
    ): Promise<AcceptanceOfDeliveryResponse> {
        const now = new Date();
        const received = new Date(request.deliverableReceivedAt);

        if (received > now) {
            throw new Error('Transaction time is before the deliverable date.');
        }

        // Calculate the inspection deadline: received date + businessDays
        // businessDays is treated as calendar days for simplicity
        const MS_PER_DAY = 24 * 60 * 60 * 1000;
        const inspectionDeadline = new Date(received.getTime() + data.businessDays * MS_PER_DAY);

        let status: IInspectionResponse['status'];
        if (now > inspectionDeadline) {
            status = InspectionStatus.OUTSIDE_INSPECTION_PERIOD;
        } else if (request.inspectionPassed) {
            status = InspectionStatus.PASSED_TESTING;
        } else {
            status = InspectionStatus.FAILED_TESTING;
        }

        return {
            result: {
                $class: 'org.accordproject.acceptanceofdelivery@0.1.0.InspectionResponse',
                $timestamp: now.toISOString(),
                status,
                shipper: data.shipper,
                receiver: data.receiver,
            },
        };
    }
}

export default AcceptanceOfDeliveryLogic;
