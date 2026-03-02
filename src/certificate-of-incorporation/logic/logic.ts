import { ITemplateModel, IIncorporationEvent } from "./generated/io.clause.certificateofincorporation@0.1.0";

// Inline type from org.accordproject.signature@0.2.0
interface IContractSigned {
    $class: string;
    $timestamp?: Date;
    contract: string;
}

type IncorporationResponse = {
    result: {
        $class: string;
        $timestamp: Date;
    };
    events: object[];
};

// @ts-ignore TemplateLogic is imported by the runtime
class CertificateOfIncorporationLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IContractSigned): Promise<IncorporationResponse> {
        const event: IIncorporationEvent = {
            $class: 'io.clause.certificateofincorporation@0.1.0.IncorporationEvent',
            $timestamp: new Date(),
            companyName: data.companyName,
            incorporationDate: data.incorporationDate,
            authorizedShareCapital: data.authorizedShareCapital,
            parValue: data.parValue
        };

        return {
            result: {
                $class: 'org.accordproject.runtime@0.2.0.Response',
                $timestamp: new Date()
            },
            events: [event]
        };
    }
}

export default CertificateOfIncorporationLogic;
