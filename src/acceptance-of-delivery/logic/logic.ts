import {
  IInspectDeliverable,
  IInspectionResponse,
  ITemplateModel,
  InspectionStatus,
} from "./generated/io.clause.acceptanceofdelivery@0.1.0";

type InspectionContractResponse = {
    result: IInspectionResponse;
};

// @ts-ignore
class AcceptanceOfDeliveryLogic extends TemplateLogic<ITemplateModel> {
  async trigger(
    data: ITemplateModel,
    request: IInspectDeliverable
  ): Promise<InspectionContractResponse> {
    const now = new Date();
    const received = new Date(request.deliverableReceivedAt);

    if (received.getTime() > now.getTime()) {
      throw new Error("Transaction time is before the deliverable date.");
    }

    const businessDaysInMs = data.businessDays * 24 * 60 * 60 * 1000;
    const deadline = new Date(received.getTime() + businessDaysInMs);

    let status: InspectionStatus;

    if (now.getTime() > deadline.getTime()) {
      status = InspectionStatus.OUTSIDE_INSPECTION_PERIOD;
    } else if (request.inspectionPassed) {
      status = InspectionStatus.PASSED_TESTING;
    } else {
      status = InspectionStatus.FAILED_TESTING;
    }

    return {
      result: {
        status,
        shipper: data.shipper,
        receiver: data.receiver,
        $class: "io.clause.acceptanceofdelivery@0.1.0.InspectionResponse",
        $timestamp: new Date(),
      },
    };
  }
}

export default AcceptanceOfDeliveryLogic;
