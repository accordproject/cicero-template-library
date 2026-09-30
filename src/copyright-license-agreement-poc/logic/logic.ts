import {
    ICopyrightLicenseData,
    ICopyrightLicenseState,
    IPaymentRequest,
    IPaymentReceived,
    IPayOut,
    IPaymentReceipt,
    IPaymentObligationEvent,
    LicenseStatus,
    PaymentStatus,
} from "./generated/poc.accordproject.copyrightlicense@0.1.0";
import { IMonetaryAmount, CurrencyCode } from "./generated/org.accordproject.money@0.3.0";

const NS = 'poc.accordproject.copyrightlicense@0.1.0';

type CopyrightLicenseInitResponse = {
    state: ICopyrightLicenseState;
};

type CopyrightLicenseResponse = {
    result: IPayOut | IPaymentReceipt;
    state: ICopyrightLicenseState;
    events: object[];
};

function monetary(doubleValue: number, currencyCode: CurrencyCode): IMonetaryAmount {
    return { $class: 'org.accordproject.money@0.3.0.MonetaryAmount', doubleValue, currencyCode };
}

// @ts-ignore TemplateLogic is imported by the runtime
class CopyrightLicenseLogic extends TemplateLogic<ICopyrightLicenseData, ICopyrightLicenseState> {
    // `state` here and in trigger() is only the template's own StateData
    // subtype. The runtime wraps it in an identified, revisioned
    // AgreementState (model/runtime.cto) that logic never sees, just as it
    // wraps `data` in an AgreementDocument.
    async init(data: ICopyrightLicenseData): Promise<CopyrightLicenseInitResponse> {
        return {
            state: {
                $class: `${NS}.CopyrightLicenseState`,
                status: LicenseStatus.AWAITING_PAYMENT,
                paymentTerms: {
                    $class: `${NS}.PaymentTermsState`,
                    status: PaymentStatus.UNPAID,
                    amountPaid: monetary(0, data.paymentTerms.amount.currencyCode),
                },
            },
        };
    }

    async trigger(
        data: ICopyrightLicenseData,
        request: IPaymentRequest | IPaymentReceived,
        state: ICopyrightLicenseState
    ): Promise<CopyrightLicenseResponse> {
        // `data` IS the template model -- there is no envelope to unwrap
        // (was: `data.data as ICopyrightLicenseData`) and no `clauses`
        // map to fall back past (was: `clauses['paymentTerms']?.data ??
        // licenseData.paymentTerms`, which left it ambiguous which copy
        // was authoritative). `paymentTerms` is simply a nested field.
        switch (request.$class) {
            case `${NS}.PaymentRequest`:
                return this.requestPayment(data, state);
            case `${NS}.PaymentReceived`:
                return this.receivePayment(data, request as IPaymentReceived, state);
            default:
                throw new Error(`Unsupported request type: ${request.$class}`);
        }
    }

    private outstanding(data: ICopyrightLicenseData, amountPaid: IMonetaryAmount): IMonetaryAmount {
        const due = data.paymentTerms.amount;
        return monetary(Math.max(0, due.doubleValue - amountPaid.doubleValue), due.currencyCode);
    }

    private requestPayment(data: ICopyrightLicenseData, state: ICopyrightLicenseState): CopyrightLicenseResponse {
        const clause = state.paymentTerms;
        if (clause.status === PaymentStatus.PAID) {
            throw new Error('The licence fee has already been paid in full.');
        }

        const amount = this.outstanding(data, clause.amountPaid);

        // `licensee`/`licensor` are `PartyRef` values: a portable,
        // already-resolved snapshot (was: a `--> Party` relationship,
        // which arrives at trigger() as an unresolvable
        // "resource:...#me" string with no registry to resolve it
        // against, requiring a hand-rolled resolveParty() helper that
        // walked a separate `parties` array). Nothing to resolve here.
        const { licensee, licensor } = data;
        const event: IPaymentObligationEvent = {
            $class: `${NS}.PaymentObligationEvent`,
            $timestamp: new Date(),
            amount,
            description: `${licensee.label} should pay contract amount to ${licensor.label}`
        };

        return {
            result: {
                $class: `${NS}.PayOut`,
                $timestamp: new Date(),
                amount
            },
            state: {
                ...state,
                paymentTerms: { ...clause, status: PaymentStatus.REQUESTED },
            },
            events: [event]
        };
    }

    private receivePayment(
        data: ICopyrightLicenseData,
        request: IPaymentReceived,
        state: ICopyrightLicenseState
    ): CopyrightLicenseResponse {
        const clause = state.paymentTerms;
        const due = data.paymentTerms.amount;
        if (clause.status === PaymentStatus.PAID) {
            throw new Error('The licence fee has already been paid in full.');
        }
        if (request.amount.currencyCode !== due.currencyCode) {
            throw new Error(`Payment must be made in ${due.currencyCode}.`);
        }
        if (request.amount.doubleValue <= 0) {
            throw new Error('Payment amount must be positive.');
        }

        const amountPaid = monetary(clause.amountPaid.doubleValue + request.amount.doubleValue, due.currencyCode);
        const paidInFull = amountPaid.doubleValue >= due.doubleValue;

        // A clause-scoped change (payment clause PAID) and an agreement-scoped
        // one (licence IN_FORCE) returned as one state, so the runtime records
        // them as a single AgreementState revision.
        return {
            result: {
                $class: `${NS}.PaymentReceipt`,
                $timestamp: new Date(),
                outstanding: this.outstanding(data, amountPaid)
            },
            state: {
                ...state,
                status: paidInFull ? LicenseStatus.IN_FORCE : state.status,
                paymentTerms: {
                    ...clause,
                    status: paidInFull ? PaymentStatus.PAID : clause.status,
                    amountPaid,
                },
            },
            events: []
        };
    }
}

export default CopyrightLicenseLogic;
