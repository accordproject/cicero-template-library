// PROTOTYPE of the test helpers template-engine would ship with
// runtime/logic.ts. They run on the same Session and Transaction as
// runtime/execute.ts, so buffering, read-your-writes and validation behave
// exactly as they do in the engine.
import { IRequest, IResponse } from '../logic/generated/org.accordproject.runtime@1.0.0';
import { IEvent } from '../logic/generated/concerto@1.0.0';
import { IStateData, ITemplateData } from '../logic/generated/org.accordproject.templatedata@1.0.0';
import { ITemplateReference } from '../logic/generated/org.accordproject.template@1.0.0';
import { DocumentJson, Options, SelfView, Session, Transaction } from './execute';
import type { Clause, Handles, Self } from './logic';

type DataOf<S> = S extends Self<infer D, any, any> ? D : never;
type StateOf<S> = S extends Self<any, infer St, any> ? St : never;
type ClausesOf<S> = S extends Self<any, any, infer C> ? C : never;

export const TEST_AGREEMENT = 'test-agreement';
export const TEST_DOCUMENT = 'test-document';

/** A placeholder template reference, for documents a test makes up. */
export function testTemplate(templateId: string): ITemplateReference {
    return {
        $class: 'org.accordproject.template@1.0.0.TemplateReference',
        templateId,
        version: '0.0.0',
        archiveHash: {
            $class: 'org.accordproject.crypto@1.0.0.ContentHash',
            algorithm: { $class: 'org.accordproject.crypto@1.0.0.HashAlgorithm', type: 'SHA_256' as never },
            value: '0'.repeat(64),
            encoding: 'HEX' as never,
        },
    };
}

export type TestSelf<S> = S & {
    /** What the engine would commit if the handler returned now. */
    readonly committed: { state: StateOf<S> | undefined; events: IEvent[] };
};

/**
 * A `self` for unit-testing a template's logic: a document of its own
 * (`test-document`, in agreement `test-agreement`), alongside any other
 * `documents` given, with `clauses` standing in for its composed clauses
 * (see `stubClause`). Pass `models` to validate everything written.
 */
export function testInstance<S extends Self<any, any, any>>(options: {
    data: DataOf<S>;
    state?: StateOf<S>;
    clauses?: Partial<ClausesOf<S>>;
    documents?: DocumentJson[];
    models?: Options['models'];
}): TestSelf<S> {
    const document = {
        $class: 'org.accordproject.agreement@1.0.0.AgreementDocument',
        documentId: TEST_DOCUMENT,
        template: testTemplate('test'),
        data: options.data as ITemplateData,
    } as DocumentJson;
    const documents = [document, ...(options.documents ?? [])];
    const agreement = {
        $class: 'org.accordproject.agreement@1.0.0.Agreement',
        $identifier: TEST_AGREEMENT,
        agreementId: TEST_AGREEMENT,
        documents: documents.map(d => `resource:org.accordproject.agreement@1.0.0.AgreementDocument#${d.documentId}`),
        parties: [],
    };
    const session = new Session(agreement, documents, 0, {}, { models: options.models });
    const root = session.tree.documents.get(TEST_DOCUMENT)!.root;
    const tx = new Transaction({ read: id => (id === root.id ? options.state as IStateData | undefined : undefined) });
    const self = new SelfView(session, root, tx, (options.clauses ?? {}) as Record<string, unknown>);
    Object.defineProperty(self, 'committed', {
        get: () => ({ state: tx.read(root.id), events: tx.events }),
    });
    return self as unknown as TestSelf<S>;
}

type Responses<A extends Handles> = {
    [C in A['$class']]?: Extract<A, { $class: C }>['response']
        | ((request: Extract<A, { $class: C }>['request']) => Extract<A, { $class: C }>['response']);
};

export type StubClause<A extends Handles> = Clause<A> & { readonly calls: IRequest[] };

/**
 * A stand-in for a composed clause, answering each request type it is
 * triggered with from `responses` (keyed by request `$class`) and
 * recording the requests. Typed by the clause's API, so a stubbed
 * response of the wrong type doesn't compile.
 */
export function stubClause<A extends Handles>(responses: Responses<A>): StubClause<A> {
    const calls: IRequest[] = [];
    const unavailable = () => { throw new Error('Not available on a stub clause.'); };
    return {
        calls,
        trigger: async (request: IRequest): Promise<IResponse> => {
            calls.push(request);
            const response = (responses as Record<string, unknown>)[request.$class];
            if (response === undefined) {
                throw new Error(`The stub clause has no response for ${request.$class}.`);
            }
            return (typeof response === 'function' ? response(request) : structuredClone(response)) as IResponse;
        },
        id: 'stub-clause',
        path: 'stub',
        template: testTemplate('stub'),
        data: {} as ITemplateData,
        state: undefined,
        parent: undefined,
        clauses: new Map(),
        get document() { return unavailable(); },
        reference: unavailable,
    } as unknown as StubClause<A>;
}
