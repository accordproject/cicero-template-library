// PROTOTYPE of the logic API template-engine would provide to templates
// under "design B" (see the README). Nothing here is released: the engine
// would supply it to the logic sandbox, as it supplies dayjs today.
//
// A template's logic is `defineLogic<Self>()` with one `.on()` per request
// type it handles, plus an optional `.init()`. Values of every model type
// are made with that type's generated factory (`PayOut.create({...})`),
// which fills in its `$class`. Each handler takes `(request, self)`:
// `self` is this template instance, a node in the agreement's tree of
// documents and clauses. Handlers write only through `self` (setState,
// emit, and triggering composed clauses), and the engine buffers those
// writes in a transaction that commits as one revision, or not at all if
// the handler throws. Logic is therefore deterministic and transactional,
// though not pure; runtime/execute.ts is the engine side.
import { IRequest, IResponse } from '../logic/generated/org.accordproject.runtime@1.0.0';
import { IConcept, IEvent } from '../logic/generated/concerto@1.0.0';
import { ITemplateData, IStateData } from '../logic/generated/org.accordproject.templatedata@1.0.0';
import { ITemplateReference } from '../logic/generated/org.accordproject.template@1.0.0';
import { IAgreementParty } from '../logic/generated/org.accordproject.agreement@1.0.0';
import { IDocumentReference } from '../logic/generated/poc.accordproject.composition@0.1.0';

export type DeepReadonly<T> =
    T extends (infer U)[] ? readonly DeepReadonly<U>[] :
    T extends Map<infer K, infer V> ? ReadonlyMap<K, DeepReadonly<V>> :
    T extends object ? { readonly [P in keyof T]: DeepReadonly<T[P]> } :
    T;

// ---------------------------------------------------------------------------
// The agreement as logic sees it: one tree, read-only except for `self`.
// ---------------------------------------------------------------------------

/** A template instance: a document, or a clause composed into one. Read-only. */
export interface Instance<Data extends ITemplateData = ITemplateData, State extends IStateData = IStateData> {
    /** Stable instance id: the document's `documentId`, or the clause's `clauseId`. */
    readonly id: string;
    /** Path from the document root, '/'-separated: '' for the document itself. */
    readonly path: string;
    readonly template: DeepReadonly<ITemplateReference>;
    readonly data: DeepReadonly<Data>;
    /** Absent for a stateless instance. */
    readonly state: DeepReadonly<State> | undefined;
    /** The instance this one is composed into; absent for a document. */
    readonly parent: Instance | undefined;
    /** Composed clauses, by path within this instance. */
    readonly clauses: ReadonlyMap<string, Instance>;
    readonly document: Document;
    /**
     * A reference to this instance, or to an inline clause within it (a
     * path into its data), for records that travel without the agreement,
     * such as obligations.
     */
    reference(inlinePath?: string): IDocumentReference;
}

export interface Document {
    readonly id: string;
    readonly parties: readonly DeepReadonly<IAgreementParty>[];
    readonly root: Instance;
    readonly agreement: Agreement;
}

export interface Agreement {
    readonly id: string;
    /** The revision this request was triggered against. */
    readonly revision: number;
    readonly parties: readonly DeepReadonly<IAgreementParty>[];
    /** In reading order. */
    readonly documents: ReadonlyMap<string, Document>;
    resolve(reference: IDocumentReference): Instance | undefined;
}

/**
 * The instance whose logic is running. Unlike every other node, it can be
 * written: its own state, the events it emits, and, by triggering them,
 * the clauses composed into it. Writes are buffered and visible to it
 * straight away; nothing is visible elsewhere until the engine commits.
 *
 * `Clauses` types the composed clauses the logic uses, by path (see
 * `Clause`); a composed clause with no logic is a plain `Instance`.
 */
export interface Self<Data extends ITemplateData, State extends IStateData | undefined = undefined, Clauses = {}>
    extends Omit<Instance<Data>, 'state' | 'clauses'> {
    /** Typed as present: handlers run only after init() has set it. */
    readonly state: State extends IStateData ? DeepReadonly<State> : undefined;
    readonly clauses: Clauses;
    setState(next: State): void;
    emit(event: IEvent): void;
}

// ---------------------------------------------------------------------------
// Request types and handlers.
// ---------------------------------------------------------------------------

/** A Concerto value with its `$class` narrowed to one literal type. */
export type Typed<T extends IConcept, C extends string> = T & { readonly $class: C };

/** A type's fields, without the system fields its factory fills in. */
export type Fields<T> = Omit<T, '$class' | '$identifier'>;

/**
 * A concrete Concerto type as a runtime value: a factory for values of
 * that type, a type guard, and, for a request type, the key logic
 * registers a handler under. Generated from the model alongside its
 * interfaces (logic/generated/types.ts).
 */
export interface ConceptType<T extends IConcept, C extends string = string> {
    readonly $class: C;
    /** A value of this type: `fields`, plus its `$class` (and `$identifier`, for an identified type). */
    create(fields: Fields<T>): Typed<T, C>;
    /** Whether `value` is exactly this type. */
    is<V extends { readonly $class: string }>(value: V): value is V & Typed<T, C>;
}

/** An identified Concerto type (an asset or participant). */
export interface IdentifiedType<T extends IConcept, C extends string = string> extends ConceptType<T, C> {
    /** A relationship to the instance identified by `id`, typed as generated interfaces type relationships. */
    ref(id: string): T;
}

/** A request type: what logic registers a handler for. */
export type RequestType<R extends IRequest, C extends string = string> = ConceptType<R, C>;

export function conceptType<T extends IConcept>() {
    return <C extends string>($class: C): ConceptType<T, C> => ({
        $class,
        create: fields => ({ $class, ...fields }) as Typed<T, C>,
        is: <V extends { readonly $class: string }>(value: V): value is V & Typed<T, C> => value?.$class === $class,
    });
}

export function identifiedType<T extends IConcept>() {
    return <C extends string>($class: C, identifiedBy: keyof Fields<T> & string): IdentifiedType<T, C> => ({
        ...conceptType<T>()($class),
        create: fields => ({ $class, $identifier: String(fields[identifiedBy as keyof typeof fields]), ...fields }) as unknown as Typed<T, C>,
        ref: (id: string) => `resource:${$class}#${id}` as unknown as T,
    });
}

/** One request a template handles, and the response it returns. */
export interface Handles {
    $class: string;
    request: IRequest;
    response: IResponse;
}

type Overloads<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/** One `trigger` overload per request type the clause's logic handles. */
export type TriggerOf<A extends Handles> = Overloads<
    A extends Handles ? (request: Typed<A['request'], A['$class']>) => Promise<A['response']> : never
>;

/**
 * A composed clause, as the instance it's composed into sees it: readable
 * like any instance, and triggerable with the requests its logic handles.
 * `A` is the clause logic's API (`ApiOf<typeof itsLogic>`), so the parent
 * depends only on the clause's request and response types.
 */
export interface Clause<A extends Handles> extends Instance {
    readonly trigger: TriggerOf<A>;
}

type Handler = (request: IRequest, self: unknown) => Promise<IResponse>;
type InitHandler = (self: unknown) => void | Promise<void>;

export interface Logic<S, A extends Handles = never> {
    /** Registers the instance's initialisation: typically setState and emit. */
    init(handler: (self: S) => void | Promise<void>): Logic<S, A>;
    /** Registers the handler for one request type. */
    on<R extends IRequest, C extends string, Res extends IResponse>(
        type: RequestType<R, C>,
        handler: (request: R, self: S) => Promise<Res>,
    ): Logic<S, A | { $class: C; request: R; response: Res }>;

    // Engine side.
    /** The request types handlers are registered for. */
    readonly requestTypes: readonly string[];
    readonly hasInit: boolean;
    /** Runs the init handler, if any. */
    start(self: S): Promise<void>;
    /**
     * Runs the handler for `request`: the one registered for its type, or
     * else for its nearest supertype (`supertypes` lists them, nearest
     * first). A request nothing handles is rejected before any logic runs.
     */
    handle(request: IRequest, self: S, supertypes?: (type: string) => string[]): Promise<IResponse>;
}

/** The requests and responses a logic handles: what a `Clause` of it accepts. */
export type ApiOf<L> = L extends Logic<any, infer A> ? A : never;

class LogicDefinition<S, A extends Handles> implements Logic<S, A> {
    constructor(
        private readonly handlers: ReadonlyMap<string, Handler> = new Map(),
        private readonly initHandler?: InitHandler,
    ) {}

    init(handler: (self: S) => void | Promise<void>): Logic<S, A> {
        if (this.initHandler) {
            throw new Error('init() is already registered.');
        }
        return new LogicDefinition<S, A>(this.handlers, handler as InitHandler);
    }

    on<R extends IRequest, C extends string, Res extends IResponse>(
        type: RequestType<R, C>,
        handler: (request: R, self: S) => Promise<Res>,
    ): Logic<S, A | { $class: C; request: R; response: Res }> {
        if (this.handlers.has(type.$class)) {
            throw new Error(`A handler is already registered for ${type.$class}.`);
        }
        const handlers = new Map(this.handlers).set(type.$class, handler as unknown as Handler);
        return new LogicDefinition(handlers, this.initHandler);
    }

    get requestTypes(): readonly string[] {
        return [...this.handlers.keys()];
    }

    get hasInit(): boolean {
        return this.initHandler !== undefined;
    }

    async start(self: S): Promise<void> {
        await this.initHandler?.(self);
    }

    async handle(request: IRequest, self: S, supertypes: (type: string) => string[] = () => []): Promise<IResponse> {
        const type = [request.$class, ...supertypes(request.$class)].find(t => this.handlers.has(t));
        if (!type) {
            throw new Error(`No handler for ${request.$class}.`);
        }
        return this.handlers.get(type)!(request, self);
    }
}

/** Starts a template's logic; `S` is its `Self` type. */
export function defineLogic<S>(): Logic<S> {
    return new LogicDefinition<S, never>();
}
