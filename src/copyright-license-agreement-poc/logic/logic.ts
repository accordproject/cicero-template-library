import { ITemplateModel, IPaymentRequest, IPayOut, IPaymentObligationEvent, ICopyrightLicenseData, IClause, IPaymentTerms, IParty } from "./generated/poc.accordproject.copyrightlicense@0.1.0";

type CopyrightLicenseResponse = {
    result: IPayOut;
    events: object[];
};

// `licensee`/`licensor` are Concerto relationships into the unified
// Party list. Like `clauses` above, logic.trigger() only ever sees raw
// JSON, so a relationship arrives as its serialized
// "resource:<fqn>#<id>" string rather than a resolved Party -- there's
// no relationship-resolution step between sample.json and here. This
// looks the referenced Party up in the document's own `parties` array,
// which is the resolution a real runtime would need to do for us.
function resolveParty(parties: IParty[], ref: IParty | string): IParty | undefined {
    const partyId = typeof ref === 'string' ? ref.split('#').pop() : ref.partyId;
    return parties.find(p => p.partyId === partyId);
}

// @ts-ignore TemplateLogic is imported by the runtime
class CopyrightLicenseLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IPaymentRequest): Promise<CopyrightLicenseResponse> {
        // Composed data (was: fields declared directly on TemplateModel).
        const licenseData = data.data as ICopyrightLicenseData;
        const parties = data.parties ?? [];
        const licensee = resolveParty(parties, licenseData.licensee);
        const licensor = resolveParty(parties, licenseData.licensor);

        // Path-addressed clause lookup (was: data.paymentClause). The
        // generated type says `clauses: Map<string, IClause>`, but
        // TemplateArchiveProcessor hands logic.trigger() the raw
        // JSON.parse()'d sample data rather than a constructed Concerto
        // Resource -- so at runtime `clauses` is a plain JSON object
        // (Concerto Maps serialize to plain objects; there's no JS Map
        // here), not an actual Map instance. Indexing rather than
        // .get() is what actually works today.
        const clauses = data.clauses as unknown as Record<string, IClause>;
        const paymentTerms = (clauses['paymentTerms']?.data as IPaymentTerms) ?? licenseData.paymentTerms;
        const amount = paymentTerms.amount;

        const event: IPaymentObligationEvent = {
            $class: 'poc.accordproject.copyrightlicense@0.1.0.PaymentObligationEvent',
            $timestamp: new Date(),
            amount,
            description: `${licensee?.name} should pay contract amount to ${licensor?.name}`
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
