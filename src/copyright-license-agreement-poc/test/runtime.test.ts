// @ts-nocheck - toy logic with free-form state
// The engine's transaction semantics (runtime/execute.ts), with toy logic
// so each behaviour is isolated. Only the last tests load models.
import { defineLogic } from '../runtime/logic';
import { AgreementDocument, LatePaymentDischarged, PaymentOverdue, PaymentSettled, ReminderSent, Request } from '../logic/generated/types';
import { execute, initialise } from '../runtime/execute';
import { testTemplate } from '../runtime/testing';
import { at, loadModels } from './support';

// Toy requests, borrowing the late payment clause's request types.
const Ping = PaymentOverdue;
const Pong = PaymentSettled;

const response = (request, extra = {}) => ({ ...LatePaymentDischarged.create({ $timestamp: request.$timestamp }), ...extra });

// A counter that fails on request once its count reaches `failAt`.
const counter = defineLogic()
    .init(self => self.setState({ count: 0 }))
    .on(Ping, async (request, self) => {
        self.setState({ count: self.state.count + 1 });
        self.emit({ from: self.id, count: self.state.count });
        if (self.data.failAt === self.state.count) {
            throw new Error(`${self.id} failed`);
        }
        if (self.clauses.inner) {
            await self.clauses.inner.trigger(Ping.create({ $timestamp: request.$timestamp }));
        }
        return response(request, { count: self.state.count });
    });

// A parent that writes, triggers its clause, and catches the clause's error.
const parent = defineLogic()
    .init(self => self.setState({ calls: 0 }))
    .on(Ping, async (request, self) => {
        self.setState({ calls: self.state.calls + 1 });
        let seen;
        try {
            await self.clauses.counter.trigger(Ping.create({ $timestamp: request.$timestamp }));
            seen = self.clauses.counter.state.count;
        } catch (e) {
            seen = e.message;
        }
        return response(request, { seen });
    })
    .on(Pong, async (request, self) => {
        await self.clauses.counter.trigger(Ping.create({ $timestamp: request.$timestamp }));
        throw new Error('parent failed');
    });

const LOGIC = { parent, counter };

const clause = (clauseId, templateId, data = {}, clauses?) => ({ clauseId, template: testTemplate(templateId), data, ...(clauses ? { clauses } : {}) });

function agreementOf(documents) {
    return {
        agreement: { agreementId: 'a', parties: [], documents: documents.map(d => AgreementDocument.ref(d.documentId)) },
        documents,
    };
}

async function setUp(counterData = {}, innerClauses?) {
    const { agreement, documents } = agreementOf([
        { documentId: 'doc', template: testTemplate('parent'), data: {}, clauses: { counter: clause('doc/counter', 'counter', counterData, innerClauses) } },
        { documentId: 'other', template: testTemplate('other'), data: { title: 'Other' } },
    ]);
    const { state } = await initialise(agreement, documents, at(0), LOGIC);
    return { agreement, documents, state, run: (request, s = state, logic = LOGIC, options = {}) => execute({ agreement, documents, state: s }, 'doc', request, logic, options) };
}

describe('the engine', () => {
    it('commits a clause\'s writes with its parent\'s, and the parent reads them straight after the trigger', async () => {
        const { run } = await setUp();

        const outcome = await run(Ping.create({ $timestamp: at(1) }));

        expect(outcome.result.seen).toBe(1);
        expect(outcome.state.states).toEqual({ 'doc': { calls: 1 }, 'doc/counter': { count: 1 } });
        expect(outcome.events).toEqual([{ from: 'doc/counter', count: 1 }]);
    });

    it('discards only the clause\'s writes when a clause throws and its parent catches', async () => {
        const { run } = await setUp({ failAt: 1 });

        const outcome = await run(Ping.create({ $timestamp: at(1) }));

        expect(outcome.result.seen).toBe('doc/counter failed');
        expect(outcome.state.states).toEqual({ 'doc': { calls: 1 }, 'doc/counter': { count: 0 } });
        expect(outcome.events).toEqual([]);
    });

    it('commits nothing at all when the parent throws after its clause succeeded', async () => {
        const { run } = await setUp();

        await expect(run(Pong.create({ $timestamp: at(1) }))).rejects.toThrow('parent failed');
    });

    it('runs clauses composed into composed clauses, each in its own nested transaction', async () => {
        const { run } = await setUp({}, { inner: clause('doc/counter/inner', 'counter', { failAt: 2 }) });

        const first = await run(Ping.create({ $timestamp: at(1) }));
        expect(first.state.states).toMatchObject({ 'doc/counter': { count: 1 }, 'doc/counter/inner': { count: 1 } });

        // The innermost clause fails: the middle one rethrows, and the parent catches it.
        const second = await run(Ping.create({ $timestamp: at(2) }), first.state);
        expect(second.result.seen).toBe('doc/counter/inner failed');
        expect(second.state.states).toMatchObject({ 'doc': { calls: 2 }, 'doc/counter': { count: 1 }, 'doc/counter/inner': { count: 1 } });
    });

    it('gives logic frozen, read-only views of everything but its own writes', async () => {
        const reader = defineLogic().on(Ping, async (request, self) => {
            const other = self.document.agreement.documents.get('other').root;
            expect(other.data.title).toBe('Other');
            expect(() => { other.data.title = 'Changed'; }).toThrow(TypeError);
            expect(() => { self.state.calls = 99; }).toThrow(TypeError);
            // Another instance's clauses, and the instance itself, can't be triggered.
            expect(other).not.toHaveProperty('trigger');
            expect(self.clauses.counter.parent.clauses.get('counter')).not.toHaveProperty('trigger');
            expect(self.clauses.counter.parent.id).toBe('doc');
            return response(request);
        });
        const { run } = await setUp();

        await run(Ping.create({ $timestamp: at(1) }), undefined, { ...LOGIC, parent: reader });
    });

    it('resolves a reference to the instance it points into, anywhere in the agreement', async () => {
        const resolver = defineLogic().on(Ping, async (request, self) => {
            const { agreement } = self.document;
            expect(agreement.resolve(self.clauses.counter.reference()).id).toBe('doc/counter');
            expect(agreement.resolve(self.clauses.counter.reference('some/inline/path')).id).toBe('doc/counter');
            expect(agreement.resolve({ agreementId: 'a', documentId: 'other' }).data.title).toBe('Other');
            expect(agreement.resolve({ agreementId: 'elsewhere', documentId: 'other' })).toBeUndefined();
            return response(request);
        });
        const { run } = await setUp();

        await run(Ping.create({ $timestamp: at(1) }), undefined, { ...LOGIC, parent: resolver });
    });

    it('refuses to trigger logic with an init() before it has been initialised', async () => {
        const { run, state } = await setUp();

        await expect(run(Ping.create({ $timestamp: at(1) }), { ...state, states: {} }))
            .rejects.toThrow("Instance 'doc' has not been initialised.");
    });

    describe('with models', () => {
        const models = loadModels();

        it('dispatches a request to the handler for its nearest supertype when it has none of its own', async () => {
            const seen = [];
            const catchAll = defineLogic().on(Request, async (request) => {
                seen.push(request.$class);
                return response(request);
            });
            const { run, state } = await setUp();

            // Only valid states pass validation, so run without the toy ones.
            await run(Ping.create({ $timestamp: at(1) }), { ...state, states: {} }, { parent: catchAll }, { models });

            expect(seen).toEqual([Ping.$class]);
        });

        it('rejects logic registered for something that is not a Request type, before anything runs', async () => {
            const wrong = defineLogic().on(ReminderSent, async r => r);
            const { run } = await setUp();

            await expect(run(Ping.create({ $timestamp: at(1) }), undefined, { ...LOGIC, parent: wrong }, { models }))
                .rejects.toThrow('handles poc.accordproject.latepayment@0.1.0.ReminderSent, which is not a Request type');
        });
    });
});
