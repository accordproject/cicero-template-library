import {
    ITemplateModel,
    IInspectDeliverable,
    IInspectionResponse,
    InspectionStatus,
} from './generated/org.accordproject.acceptanceofdelivery@0.1.0';

type AcceptanceOfDeliveryResponse = {
    result: IInspectionResponse;
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

        let status: InspectionStatus;
        if (now > inspectionDeadline) {
            status = 'OUTSIDE_INSPECTION_PERIOD';
        } else if (request.inspectionPassed) {
            status = 'PASSED_TESTING';
        } else {
            status = 'FAILED_TESTING';
        }

        return {
            result: {
                $class: 'org.accordproject.acceptanceofdelivery@0.1.0.InspectionResponse',
                $timestamp: now,
                $identifier: request.$identifier,
                status,
                shipper: data.shipper,
                receiver: data.receiver,
            },
        };
    }
}

export default AcceptanceOfDeliveryLogic;
