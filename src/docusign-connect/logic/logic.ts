import {
    ITemplateModel,
    IMyResponse,
    IDocuSignEnvelopeCounterState,
    IDocuSignNotificationEvent
} from "./generated/io.clause.docusignconnect@0.1.0";

// Inline types from com.docusign.connect — generated files reference these types
interface IEnvelopeStatus {
    $class: string;
    status: string;
}

interface IDocuSignEnvelopeInformation {
    $class: string;
    envelopeStatus: IEnvelopeStatus;
}

// @ts-expect-error EngineResponse is imported by the runtime
interface DocuSignConnectResponse extends EngineResponse<IDocuSignEnvelopeCounterState> {
    result: IMyResponse;
    state: object;
    events: object[];
}

// @ts-ignore TemplateLogic is imported by the runtime
class DocuSignConnectLogic extends TemplateLogic<ITemplateModel, IDocuSignEnvelopeCounterState> {

    // @ts-expect-error InitResponse is imported by the runtime
    async init(data: ITemplateModel): Promise<InitResponse<IDocuSignEnvelopeCounterState>> {
        return {
            state: {
                $class: 'io.clause.docusignconnect@0.1.0.DocuSignEnvelopeCounterState',
                $identifier: data.$identifier,
                counter: 0
            }
        };
    }

    private buildMessage(counter: number, status: string): string {
        return `Have received ${counter} contracts with status ${status}`;
    }

    async trigger(
        data: ITemplateModel,
        request: IDocuSignEnvelopeInformation,
        state: IDocuSignEnvelopeCounterState
    ): Promise<DocuSignConnectResponse> {
        const requestStatus = request.envelopeStatus.status;
        const contractStatus = data.status as string;

        // If the envelope status does not match the contract status, return without incrementing
        if (requestStatus !== contractStatus) {
            return {
                result: {
                    $class: 'io.clause.docusignconnect@0.1.0.MyResponse',
                    $timestamp: new Date(),
                    output: this.buildMessage(state.counter, contractStatus),
                    counter: state.counter
                },
                state: {
                    ...state
                },
                events: []
            };
        }

        const newCounter = state.counter + 1;

        const newState: IDocuSignEnvelopeCounterState = {
            $class: 'io.clause.docusignconnect@0.1.0.DocuSignEnvelopeCounterState',
            $identifier: state.$identifier,
            counter: newCounter
        };

        const event: IDocuSignNotificationEvent = {
            $class: 'io.clause.docusignconnect@0.1.0.DocuSignNotificationEvent',
            $timestamp: new Date(),
            title: `Contracts with status ${contractStatus}`,
            message: this.buildMessage(newCounter, contractStatus)
        };

        return {
            result: {
                $class: 'io.clause.docusignconnect@0.1.0.MyResponse',
                $timestamp: new Date(),
                output: this.buildMessage(newCounter, contractStatus),
                counter: newCounter
            },
            state: newState,
            events: [event]
        };
    }
}

export default DocuSignConnectLogic;
