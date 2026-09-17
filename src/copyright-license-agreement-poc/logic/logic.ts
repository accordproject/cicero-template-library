import { ICopyrightLicenseData, IPaymentRequest, IPayOut, IPaymentObligationEvent } from "./generated/poc.accordproject.copyrightlicense@0.1.0";

type CopyrightLicenseResponse = {
    result: IPayOut;
    events: object[];
};

// @ts-ignore TemplateLogic is imported by the runtime
class CopyrightLicenseLogic extends TemplateLogic<ICopyrightLicenseData> {
    async trigger(data: ICopyrightLicenseData, request: IPaymentRequest): Promise<CopyrightLicenseResponse> {
        // `data` IS the template model -- there is no envelope to unwrap
        // (was: `data.data as ICopyrightLicenseData`) and no `clauses`
        // map to fall back past (was: `clauses['paymentTerms']?.data ??
        // licenseData.paymentTerms`, which left it ambiguous which copy
        // was authoritative). `paymentTerms` is simply a nested field.
        const { licensee, licensor, paymentTerms } = data;
        const amount = paymentTerms.amount;

        // `licensee`/`licensor` are `PartyRef` values: a portable,
        // already-resolved snapshot (was: a `--> Party` relationship,
        // which arrives at trigger() as an unresolvable
        // "resource:...#me" string with no registry to resolve it
        // against, requiring a hand-rolled resolveParty() helper that
        // walked a separate `parties` array). Nothing to resolve here.
        const event: IPaymentObligationEvent = {
            $class: 'poc.accordproject.copyrightlicense@0.1.0.PaymentObligationEvent',
            $timestamp: new Date(),
            amount,
            description: `${licensee.label} should pay contract amount to ${licensor.label}`
        };

        return {
            result: {
                $class: 'poc.accordproject.copyrightlicense@0.1.0.PayOut',
                $timestamp: new Date(),
                amount
            },
            events: [event]
        };
    }
}

export default CopyrightLicenseLogic;
