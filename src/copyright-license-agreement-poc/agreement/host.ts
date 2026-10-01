// A minimal stand-in for the runtime side of "design B" (see the README),
// used by test/agreement.test.ts. It is not part of any template, and no
// released tooling does this yet. It shows the runtime's whole job under
// that design:
//
// - walk each document's tree of template instances;
// - run a document's logic with handles to the clauses composed into it;
// - commit the document's returned state, and any composed clause states it
//   returns, to the state index as ONE revision, or nothing if it throws.
//
// It enforces no rules about state's shape or consistency; that is the
// logic's job. Concerto validation of what logic returns is left out here,
// as test/agreement.test.ts validates the results itself.
import { IAgreement, ITemplateInstance } from '../logic/generated/poc.accordproject.agreement@0.1.0';
import { IAgreementState } from '../logic/generated/poc.accordproject.runtime@0.1.0';
import { IStateData } from '../logic/generated/poc.accordproject.templatedata@0.1.0';

type Request = { $class: string; $timestamp: string };

type LogicResponse = {
    result: unknown;
    state?: IStateData;
    clauseStates?: Record<string, IStateData | undefined>;
    events?: object[];
};

export type ComposedClause = {
    trigger(request: Request): Promise<LogicResponse>;
};

export interface Logic {
    init?(data: unknown): Promise<{ state?: IStateData; events?: object[] }>;
    trigger(data: unknown, request: Request, state: IStateData | undefined, clauses: Record<string, ComposedClause>): Promise<LogicResponse>;
}

// Template logic by `TemplateReference.templateId`. A template with no
// entry has no logic (e.g. a stateless schedule).
export type LogicRegistry = Record<string, new () => Logic>;

export class AgreementHost {
    constructor(private readonly agreement: IAgreement, private readonly logic: LogicRegistry) {}

    async init(effectiveAt: string): Promise<{ state: IAgreementState; events: object[] }> {
        const states = new Map<string, IStateData>();
        const events: object[] = [];
        for (const instance of this.instances()) {
            const logic = this.logicFor(instance);
            if (!logic?.init) {
                continue;
            }
            const response = await logic.init(instance.data);
            if (response.state) {
                states.set(instance.instanceId, response.state);
            }
            events.push(...(response.events ?? []));
        }
        return { state: this.envelope(0, effectiveAt, states), events };
    }

    async trigger(current: IAgreementState, documentId: string, request: Request) {
        const document = this.agreement.documents.find(d => d.documentId === documentId);
        if (!document) {
            throw new Error(`No document '${documentId}' in agreement '${this.agreement.agreementId}'.`);
        }
        const root = document.root;
        const logic = this.logicFor(root);
        if (!logic) {
            throw new Error(`Document '${documentId}' has no logic to trigger.`);
        }

        const states = current.states ?? new Map<string, IStateData>();
        const response = await logic.trigger(root.data, request, states.get(root.instanceId), this.clauses(root, states));

        const next = new Map(states);
        if (response.state) {
            next.set(root.instanceId, response.state);
        }
        for (const [path, state] of Object.entries(response.clauseStates ?? {})) {
            const clause = root.children?.get(path);
            if (!clause) {
                throw new Error(`No clause is composed into '${documentId}' at '${path}'.`);
            }
            if (state) {
                next.set(clause.instanceId, state);
            }
        }
        return {
            result: response.result,
            events: response.events ?? [],
            state: this.envelope(current.revision + 1, request.$timestamp, next),
        };
    }

    // Handles for the clauses composed into `instance`. Each runs the clause
    // template's own logic against that clause's own data and current state,
    // and writes nothing: the caller decides what to return for commit.
    // This sketch supports one level of composition, so a composed clause's
    // own composed clauses get no handles.
    private clauses(instance: ITemplateInstance, states: Map<string, IStateData>): Record<string, ComposedClause> {
        const handles: Record<string, ComposedClause> = {};
        for (const [path, clause] of instance.children ?? new Map<string, ITemplateInstance>()) {
            const logic = this.logicFor(clause);
            if (logic) {
                handles[path] = {
                    trigger: request => logic.trigger(clause.data, request, states.get(clause.instanceId), {}),
                };
            }
        }
        return handles;
    }

    private logicFor(instance: ITemplateInstance): Logic | undefined {
        const LogicClass = this.logic[instance.template.templateId];
        return LogicClass ? new LogicClass() : undefined;
    }

    private *instances(): Generator<ITemplateInstance> {
        function* walk(instance: ITemplateInstance): Generator<ITemplateInstance> {
            yield instance;
            for (const child of instance.children?.values() ?? []) {
                yield* walk(child);
            }
        }
        for (const document of this.agreement.documents) {
            yield* walk(document.root);
        }
    }

    private envelope(revision: number, effectiveAt: string, states: Map<string, IStateData>): IAgreementState {
        const stateId = `${this.agreement.agreementId}-state`;
        return {
            $class: 'poc.accordproject.runtime@0.1.0.AgreementState',
            $identifier: stateId,
            stateId,
            agreement: `resource:poc.accordproject.agreement@0.1.0.Agreement#${this.agreement.agreementId}` as unknown as IAgreement,
            revision,
            effectiveAt,
            states,
        };
    }
}
