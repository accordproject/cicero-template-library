import {
    ITemplateModel,
    IPurchaseOrderFailureResponse,
    IPurchaseOrderFailureState,
    IPurchaseOrderPaymentEvent
} from "./generated/io.clause.docusignpofailure@0.1.0";

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

// Inline types from com.docusign.connect — generated files reference these types
interface ITabStatus {
    $class: string;
    tabType: string;
    status: string;
    tabLabel: string;
    tabName?: string;
}

interface ITextTabStatus extends ITabStatus {
    tabValue: string;
    customTabType?: string;
    originalValue?: string;
}

interface INumberTabStatus extends ITabStatus {
    tabValue: number;
    customTabType?: string;
    originalValue?: string;
}

interface IDateTabStatus extends ITabStatus {
    tabValue: string;
    customTabType?: string;
    originalValue?: string;
}

interface IRecipient {
    $class: string;
    status: string;
    email: string;
    userName: string;
    tabStatuses?: ITabStatus[];
}

interface IEnvelopeStatus {
    $class: string;
    status: string;
}

interface IDocuSignEnvelopeInformation {
    $class: string;
    envelopeStatus: IEnvelopeStatus;
    recipients?: IRecipient[];
}

// @ts-expect-error EngineResponse is imported by the runtime
interface PurchaseOrderResponse extends EngineResponse<IPurchaseOrderFailureState> {
    result: IPurchaseOrderFailureResponse;
    state: object;
    events: object[];
}

// @ts-ignore TemplateLogic is imported by the runtime
class PurchaseOrderFailureLogic extends TemplateLogic<ITemplateModel, IPurchaseOrderFailureState> {

    // @ts-expect-error InitResponse is imported by the runtime
    async init(data: ITemplateModel): Promise<InitResponse<IPurchaseOrderFailureState>> {
        return {
            state: {
                $class: 'io.clause.docusignpofailure@0.1.0.PurchaseOrderFailureState',
                $identifier: data.$identifier,
                pastFailures: [],
                nbPastFailures: 0
            }
        };
    }

    private convertDurationToMilliseconds(duration: IDuration): number {
        const MS_PER_SECOND = 1000;
        const MS_PER_MINUTE = MS_PER_SECOND * 60;
        const MS_PER_HOUR = MS_PER_MINUTE * 60;
        const MS_PER_DAY = MS_PER_HOUR * 24;
        const MS_PER_WEEK = MS_PER_DAY * 7;

        switch (duration.unit) {
            case TemporalUnit.seconds: return duration.amount * MS_PER_SECOND;
            case TemporalUnit.minutes: return duration.amount * MS_PER_MINUTE;
            case TemporalUnit.hours:   return duration.amount * MS_PER_HOUR;
            case TemporalUnit.days:    return duration.amount * MS_PER_DAY;
            case TemporalUnit.weeks:   return duration.amount * MS_PER_WEEK;
            default: throw new Error(`Unsupported temporal unit: ${duration.unit}`);
        }
    }

    private getAllTabStatuses(recipients: IRecipient[]): ITabStatus[] {
        const all: ITabStatus[] = [];
        for (const recipient of recipients) {
            if (recipient.tabStatuses) {
                all.push(...recipient.tabStatuses);
            }
        }
        return all;
    }

    private findTab(tabStatuses: ITabStatus[], name: string): ITabStatus | undefined {
        return tabStatuses.find(t => t.tabLabel === name || (t as any).tabName === name);
    }

    private getDateTabFromRecipients(env: IDocuSignEnvelopeInformation, name: string): Date | undefined {
        if (!env.recipients) return undefined;
        const tabs = this.getAllTabStatuses(env.recipients);
        const tab = this.findTab(tabs, name);
        if (!tab || tab.$class !== 'com.docusign.connect.DateTabStatus') return undefined;
        const dateTab = tab as IDateTabStatus;
        return new Date(dateTab.tabValue);
    }

    private getNumberTabFromRecipients(env: IDocuSignEnvelopeInformation, name: string): number | undefined {
        if (!env.recipients) return undefined;
        const tabs = this.getAllTabStatuses(env.recipients);
        const tab = this.findTab(tabs, name);
        if (!tab || tab.$class !== 'com.docusign.connect.NumberTabStatus') return undefined;
        return (tab as INumberTabStatus).tabValue;
    }

    private getTextTabFromRecipients(env: IDocuSignEnvelopeInformation, name: string): string | undefined {
        if (!env.recipients) return undefined;
        const tabs = this.getAllTabStatuses(env.recipients);
        const tab = this.findTab(tabs, name);
        if (!tab || tab.$class !== 'com.docusign.connect.TextTabStatus') return undefined;
        return (tab as ITextTabStatus).tabValue;
    }

    private failuresInRange(pastFailures: string[], rangeDuration: IDuration): string[] {
        const rangeMs = this.convertDurationToMilliseconds(rangeDuration);
        const cutoff = new Date(Date.now() - rangeMs);
        return pastFailures.filter(d => new Date(d) > cutoff);
    }

    async trigger(
        data: ITemplateModel,
        request: IDocuSignEnvelopeInformation,
        state: IPurchaseOrderFailureState
    ): Promise<PurchaseOrderResponse> {
        const deliveryDate = this.getDateTabFromRecipients(request, 'deliveryDate');
        if (!deliveryDate) {
            throw new Error('Could not find a deliveryDate tab');
        }

        const actualPrice = this.getNumberTabFromRecipients(request, 'actualPrice');
        if (actualPrice === undefined) {
            throw new Error('Could not find an actualPrice tab');
        }

        const currencyCode = this.getTextTabFromRecipients(request, 'currencyCode');
        if (!currencyCode) {
            throw new Error('Could not find a currencyCode tab');
        }

        const lateOneDuration = data.lateOne as unknown as IDuration;
        const lateTwoDuration = data.lateTwo as unknown as IDuration;
        const lateThreeDuration = data.lateThree as unknown as IDuration;
        const failureRangeDuration = data.failureRange as unknown as IDuration;

        const lateOneMs = this.convertDurationToMilliseconds(lateOneDuration);
        const lateTwoMs = this.convertDurationToMilliseconds(lateTwoDuration);
        const lateThreeMs = this.convertDurationToMilliseconds(lateThreeDuration);

        const now = Date.now();
        const deliveryMs = deliveryDate.getTime();

        // Check if delivery is late at all
        if (now <= deliveryMs + lateOneMs) {
            return {
                result: {
                    $class: 'io.clause.docusignpofailure@0.1.0.PurchaseOrderFailureResponse',
                    $timestamp: new Date(),
                    penaltyAmount: 0.0,
                    currencyCode
                },
                state: { ...state },
                events: []
            };
        }

        // Determine penalty percentage based on lateness tier
        let penaltyPercent: number;
        if (now > deliveryMs + lateThreeMs) {
            penaltyPercent = data.lateThreePercent;
        } else if (now > deliveryMs + lateTwoMs) {
            penaltyPercent = data.lateTwoPercent;
        } else {
            penaltyPercent = data.lateOnePercent;
        }

        // Update past failures within range
        const updatedFailures = this.failuresInRange(
            [...(state.pastFailures as string[]), deliveryDate.toISOString()],
            failureRangeDuration
        );
        const nbFailures = updatedFailures.length;

        // Calculate penalty amount
        let penaltyAmount = penaltyPercent / 100.0 * actualPrice;
        if (state.nbPastFailures >= data.maxFailures) {
            penaltyAmount += data.repeatedFailureCompensationAmount;
        }

        const newState: IPurchaseOrderFailureState = {
            $class: 'io.clause.docusignpofailure@0.1.0.PurchaseOrderFailureState',
            $identifier: state.$identifier,
            pastFailures: updatedFailures as unknown as Date[],
            nbPastFailures: nbFailures
        };

        const event: IPurchaseOrderPaymentEvent = {
            $class: 'io.clause.docusignpofailure@0.1.0.PurchaseOrderPaymentEvent',
            $timestamp: new Date(),
            penaltyAmount,
            currencyCode,
            description: `${data.buyerName} should be paid a penalty`
        };

        return {
            result: {
                $class: 'io.clause.docusignpofailure@0.1.0.PurchaseOrderFailureResponse',
                $timestamp: new Date(),
                penaltyAmount,
                currencyCode
            },
            state: newState,
            events: [event]
        };
    }
}

export default PurchaseOrderFailureLogic;
