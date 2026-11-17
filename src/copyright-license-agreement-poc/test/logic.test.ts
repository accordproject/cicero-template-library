// DRAFT for the next major release. It drives the licence through the engine
// boundary with the engine's test host (TestHost): the host loads the
// archives (the licence and its schedule, a text template in schedule/),
// makes the agreement of two documents (`instantiate`, revision 0), attests
// each request's inputs (principal, business time, requestId, and, only when
// the caller names one, the instance revision its decision rests on:
// `expect`) and calls `trigger(agreement, state, request, inputs)`.
//
// Each session is recorded as an end-to-end vector in test-vectors/
// (`npm run test:record` writes them; `npm test` checks a fresh session
// against its stored vector byte for byte), and every stored vector is
// replayed against the engine boundary directly, without the test host.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
    canonicalJson,
    trigger,
    instantiate,
    isCommitted,
    isRejection,
    loadAgreement,
    loadLibrary,
    TestHost,
    type AgreementSpec,
    type Archive,
    type SessionVector,
} from '@accordproject/template-engine';
import {
    AcceptanceRefused,
    AcceptLicence,
    CopyrightLicenseData,
    CopyrightLicenseState,
    FeeOverdue,
    FeePaymentRefused,
    FeeSettled,
    LicenceAccepted,
    OverdueHandled,
    PaymentRequest,
    PayOut,
    RecordFeePayment,
    RoyaltyStatement,
    RoyaltyStatementRefused,
    RoyaltyStatementRequest,
    type ICopyrightLicenseData,
    type ICopyrightLicenseState,
} from '../logic/generated/poc.accordproject.copyrightlicense@0.2.0.js';
import {
    LicensedWorksScheduleData,
    type ILicensedWorksScheduleData,
} from '../logic/generated/poc.accordproject.copyrightlicense.schedule@0.1.0.js';
import {
    LateFeeAccrued,
    NothingOutstanding,
    PaymentOverdue,
    PaymentSettled,
    ReminderLimitReached,
    ReminderSent,
} from '../logic/generated/org.accordproject.latepayment.api@1.2.0.js';
import { MonetaryUnit, PreciseAmount } from '../logic/generated/org.accordproject.money@1.0.0.js';
import { AmountOutstanding } from '../logic/generated/org.accordproject.outstanding.api@1.0.0.js';
import { SalesToDate, type ISalesToDate } from '../logic/generated/org.accordproject.royalty.api@1.0.0.js';
import { PaymentObligation } from '../logic/generated/org.accordproject.runtime@1.0.0.js';
import {
    PaymentReminder,
    type ILatePaymentState,
} from '../../late-payment-clause-poc/logic/generated/poc.accordproject.latepayment@0.1.0.js';
import sample from '../sample.json';
import scheduleSample from '../schedule/sample.json';
import latePaymentSample from '../../late-payment-clause-poc/sample.json';
import agreementSample from '../agreement.json';
import { acceptanceDigest } from '../logic/logic.js';
import { formatAmount } from '../logic/helpers.js';

const templateDir = path.join(__dirname, '..');
const scheduleDir = path.join(templateDir, 'schedule');
const clauseDir = path.join(templateDir, '..', 'late-payment-clause-poc');
const vectorDir = path.join(templateDir, 'test-vectors');
const RECORD = process.env.RECORD_VECTORS === '1';
// Business time the agreement is made, and the payment asked, at.
const START = '2018-01-01T00:00:00.000Z';
// The fee's due date (sample.json paymentTerms.dueDate), in UTC.
const DUE = '2018-01-31T16:00:00.000Z';

let archive: Archive;
let schedule: Archive;
let latePayment: Archive;

beforeAll(async () => {
    // The schedule is hashed first, and its hash pinned in the licence's manifest ("documents").
    // The late payment clause's slot asks for an interface, so nothing pins it: the agreement names it.
    const library = await loadLibrary([scheduleDir, clauseDir, templateDir]);
    archive = library.named('copyright-license-agreement-poc', '0.2.0');
    schedule = library.named('copyright-license-schedule-poc', '0.1.0');
    latePayment = library.named('late-payment-clause-poc', '0.1.0');
});

const scheduleData = (data: Partial<ILicensedWorksScheduleData> = {}) =>
    LicensedWorksScheduleData.create({ ...(scheduleSample as Parameters<typeof LicensedWorksScheduleData.create>[0]), ...data });

/** The late payment clause's data, as agreement.json gives it (its utcOffset is bound from the licence's). */
const latePaymentData = () => ({ ...latePaymentSample }) as Record<string, unknown>;

/**
 * The agreement: the licence (primary) with its late payment clause in the
 * `latePayment` slot (instance licence/late-payment), and its schedule, a
 * document of its own that the licence's `schedule` reference names.
 * `withLatePayment: false` leaves the optional slot empty.
 */
function agreement(data: ICopyrightLicenseData, works = scheduleData(), withLatePayment = true): AgreementSpec {
    return {
        agreementId: 'copyright-licence',
        primary: 'licence',
        documents: [
            {
                documentId: 'licence', template: { hash: archive.hash }, data, references: { schedule: 'schedule' },
                ...(withLatePayment ? { clauses: { 'late-payment': { template: { hash: latePayment.hash }, data: latePaymentData() } } } : {}),
            },
            { documentId: 'schedule', template: { hash: schedule.hash }, data: works },
        ],
        archives: withLatePayment ? [archive, schedule, latePayment] : [archive, schedule],
    };
}

/** USD at scale 2, from a whole-cent string. */
const usd = (unscaledValue: string) => PreciseAmount.create({ unscaledValue, unit: MonetaryUnit.create({ currencyCode: 'USD', scale: 2 }) });

/**
 * The sales registry, as the test host reads it: the SalesToDate record for
 * the account the licence's read names. A test moves the figures on by
 * changing `registry.sales`; the host reads them afresh for each request.
 */
const salesRecord = (unitsSold: number, grossReceipts = usd('0')) =>
    SalesToDate.create({ salesAccountId: 'sales-account-001', unitsSold, grossReceipts });
const registry: { sales: ISalesToDate } = { sales: salesRecord(0) };

beforeEach(() => {
    registry.sales = salesRecord(0);
});

function make(data: ICopyrightLicenseData, works = scheduleData(), withLatePayment = true) {
    const { host, result } = TestHost.make(agreement(data, works, withLatePayment), {
        start: START,
        // The licence's `sales` read: the host reads the record its key names.
        suppliers: { sales: (read) => (read.key === registry.sales.salesAccountId ? registry.sales : undefined) },
    });
    expect(isCommitted(result)).toBe(true);
    return { host, result };
}

// The licensee asks what it owes. The licence refuses nobody.
const asLicensee = (data: ICopyrightLicenseData) => ({ actor: data.licensee });
// The licensor records the fee paid.
const asLicensor = (data: ICopyrightLicenseData) => ({ actor: data.licensor });

/** Records the session as a vector, or checks it against the recorded one byte for byte. */
function vector(host: TestHost, id: string) {
    const session = host.session(id);
    const file = path.join(vectorDir, `${id}.json`);
    if (RECORD) {
        mkdirSync(vectorDir, { recursive: true });
        writeFileSync(file, `${JSON.stringify(session, null, 2)}\n`);
    }
    expect(existsSync(file), `${file} is recorded (npm run test:record)`).toBe(true);
    expect(canonicalJson(session)).toBe(canonicalJson(JSON.parse(readFileSync(file, 'utf8'))));
}

describe('copyright licence', () => {
    let data: ICopyrightLicenseData;

    beforeEach(() => {
        data = CopyrightLicenseData.create(sample as Parameters<typeof CopyrightLicenseData.create>[0]);
    });

    it('starts with no acceptances and the fee not due at revision 0; the late payment clause starts with no reminders; the schedule, a text document, has no state', () => {
        const { host, result } = make(data);
        expect(result.body.revisionTo).toBe(0);
        expect(CopyrightLicenseState.is(host.stateOf('licence'))).toBe(true);
        expect(host.stateOf<ICopyrightLicenseState>('licence')).toMatchObject({ acceptances: [], fee: 'NOT_DUE' });
        expect(host.stateOf<ILatePaymentState>('licence/late-payment')).toMatchObject({ remindersSent: 0, pendingReminders: [], settled: false });
        expect(Object.keys(host.state.states).sort()).toEqual(['licence', 'licence/late-payment']);
        // The licence binds its utcOffset into the clause's data.
        expect(host.agreement.instances.get('licence/late-payment')!.data).toMatchObject({ utcOffset: '+01:00' });
        expect([...host.agreement.documents.keys()]).toEqual(['licence', 'schedule']);
        expect(host.agreement.documents.get('licence')!.references.get('schedule')!.documentId).toBe('schedule');
        vector(host, 'licence-instantiate');
    });

    it('drafts each document: the licence refers to the schedule, and the schedule lists the works', () => {
        const { result } = make(data);
        const [licence, works] = result.body.artifacts;
        expect(licence?.kind).toBe('agreement');
        expect(licence?.instance).toBe('licence');
        expect(licence?.text).toContain('dated as of 2018-01-01T01:00:00.000+01:00 (the "Effective Date")');
        expect(licence?.text).toContain('is made by and between Me ("Licensee") and Myself ("Licensor")');
        expect(licence?.text).toContain('a one-time fee in the amount of one hundred US Dollars (100.00 USD) upon execution of this Agreement, and in any event no later than 2018-01-31T17:00:00.000+01:00, payable as follows: bank transfer.');
        expect(licence?.text).toContain('The "Work" is defined as the work or works listed in the Schedule of Licensed Works, which forms part of this Agreement (the "Schedule").');
        expect(licence?.text).toContain('Royalty. In addition, Licensee shall pay Licensor a royalty of 10% of the gross receipts from the Work, as the sales registry reports them for Licensee\'s sales account sales-account-001.');
        // The late payment clause is drafted in place, in the licence's text.
        expect(licence?.text).toContain('a further reminder every 7 days until the amount is paid, up to 3 reminders in all. A late fee of 25.00 USD becomes payable when the first reminder is sent.');
        expect(licence?.text).not.toContain('other stuff');
        expect(licence?.hash).toMatch(/^[0-9a-f]{64}$/);
        // The schedule is drafted as itself, with its own text and hash.
        expect(works?.kind).toBe('agreement');
        expect(works?.instance).toBe('schedule');
        expect(works?.template?.hash).toBe(schedule.hash);
        expect(works?.text).toContain('Schedule of Licensed Works');
        expect(works?.text).toContain('The Work: other stuff');
        expect(works?.hash).toMatch(/^[0-9a-f]{64}$/);
        expect(works?.hash).not.toBe(licence?.hash);
    });

    it('answers a payment request with the fee, notifies a payment obligation due on the due date, and sets a timer for it', () => {
        const { host } = make(data);
        const run = host.send(PaymentRequest.create({}), asLicensee(data));

        expect(isCommitted(run)).toBe(true);
        if (!isCommitted(run)) return;
        const response = run.body.response;
        expect(PayOut.is(response)).toBe(true);
        if (!PayOut.is(response)) return;
        expect(response.amount.unscaledValue).toBe('10000');
        expect(response.amount.unit.currencyCode).toBe('USD');

        expect(run.body.effects).toHaveLength(0);
        expect(run.body.notifications).toHaveLength(1);
        const obligation = run.body.notifications[0];
        expect(PaymentObligation.is(obligation)).toBe(true);
        if (!PaymentObligation.is(obligation)) return;
        expect(obligation.obligor.partyId).toBe('me');
        expect(obligation.obligee.partyId).toBe('myself');
        expect(obligation.amount.unscaledValue).toBe('10000');
        // The logic writes no prose: who owes whom and how much are typed fields; the description names the term.
        expect(obligation.description).toBe('One-time licence fee');
        expect(obligation.dueAt).toBe('2018-01-31T17:00:00.000+01:00');
        // The engine stamps the obligation with the business time.
        expect(obligation.$timestamp).toBe(START);
        // The fee is due, and the licence's timer is set for the due date.
        expect(host.stateOf<ICopyrightLicenseState>('licence').fee).toBe('DUE');
        expect(host.revisionOf('licence')).toBe(1);
        expect(host.state.timers.map((t) => [t.instance, t.timer.id, t.timer.at])).toEqual([['licence', 'fee-overdue', '2018-01-31T17:00:00.000+01:00']]);

        // Asking again changes nothing.
        const again = host.send(PaymentRequest.create({}), asLicensee(data));
        expect(isCommitted(again) && again.body.notifications).toEqual([]);
        expect(host.revisionOf('licence')).toBe(1);
        vector(host, 'licence-payment-request');
    });

    it('reads the fee from the payment terms', () => {
        const gbp = PreciseAmount.create({
            unscaledValue: '25000',
            unit: MonetaryUnit.create({ currencyCode: 'GBP', scale: 2 }),
        });
        const base = sample as unknown as ICopyrightLicenseData;
        data = CopyrightLicenseData.create({ ...base, paymentTerms: { ...base.paymentTerms, amount: gbp } });

        const { host } = make(data);
        const run = host.send(PaymentRequest.create({}), asLicensee(data));

        expect(isCommitted(run)).toBe(true);
        if (!isCommitted(run)) return;
        const response = run.body.response;
        expect(PayOut.is(response)).toBe(true);
        if (!PayOut.is(response)) return;
        expect(response.amount.unscaledValue).toBe('25000');
        expect(response.amount.unit.currencyCode).toBe('GBP');
        const obligation = run.body.notifications[0];
        expect(PaymentObligation.is(obligation)).toBe(true);
        if (!PaymentObligation.is(obligation)) return;
        expect(obligation.amount.unscaledValue).toBe('25000');
        vector(host, 'licence-fee-from-terms');
    });

    it('records each party\'s acceptance of the whole agreement, bound to the agreement\'s terms version', () => {
        const { host } = make(data);
        const terms = host.agreement.agreementTermsHash;
        const accept = (party: { partyId: string; displayName: string }, digest = acceptanceDigest(party.partyId, terms)) =>
            host.send(AcceptLicence.create({ digest }), { actor: party });

        const byLicensee = accept(data.licensee);
        expect(isCommitted(byLicensee)).toBe(true);
        if (!isCommitted(byLicensee)) return;
        expect(LicenceAccepted.is(byLicensee.body.response)).toBe(true);
        expect(byLicensee.body.response).toMatchObject({ party: { partyId: 'me' }, agreementTermsHash: terms });

        // Someone who is neither party is refused; so is the licensor's acceptance of a digest for other terms.
        const stranger = accept({ partyId: 'stranger', displayName: 'Stranger' });
        expect(isRejection(stranger) && stranger.body).toMatchObject({ response: { reason: 'NOT_A_PARTY' }, declinedBy: 'licence' });
        const wrong = accept(data.licensor, acceptanceDigest('myself', '0'.repeat(64)));
        expect(isRejection(wrong) && AcceptanceRefused.is(wrong.body.response) && wrong.body.response.reason).toBe('TERMS_CHANGED');

        expect(isCommitted(accept(data.licensor))).toBe(true);
        expect(host.stateOf<ICopyrightLicenseState>('licence').acceptances.map((a) => [a.party.partyId, a.acceptedAt])).toEqual([['me', START], ['myself', START]]);
        expect(host.revisionOf('licence')).toBe(2);
        vector(host, 'licence-acceptance');
    });

    it('when the fee is overdue, the late payment clause sends a reminder every 7 days, up to 3, and accrues the late fee once; paying stops it', () => {
        const { host } = make(data);
        expect(isCommitted(host.send(PaymentRequest.create({}), asLicensee(data)))).toBe(true);

        // Before the due date nothing fires.
        host.at('2018-01-31T15:59:59.000Z');
        expect(host.fireDueTimers()).toEqual([]);

        // At the due date the licence's timer fires, and the licence calls its clause.
        host.at(DUE);
        const [first] = host.fireDueTimers();
        expect(isCommitted(first)).toBe(true);
        if (!isCommitted(first)) return;
        expect(OverdueHandled.is(first.body.response) && first.body.response.reminder).toBe(1);
        // The reminder is an effect of the clause's, for what the licence's AmountOutstanding fact says is owed;
        // the late fee is a notification of the clause's.
        expect(first.body.effects.map((e) => [e.$class, (e as { reminder?: number }).reminder])).toEqual([[PaymentReminder.$class, 1]]);
        expect(first.body.effects[0]).toMatchObject({ to: { partyId: 'me' }, from: { partyId: 'myself' }, amount: { unscaledValue: '10000' }, dueAt: '2018-01-31T17:00:00.000+01:00' });
        expect(first.body.notifications.map((n) => n.$class)).toEqual([LateFeeAccrued.$class]);
        expect(first.body.notifications[0]).toMatchObject({ obligor: { partyId: 'me' }, obligee: { partyId: 'myself' }, amount: { unscaledValue: '2500' } });
        expect(host.state.pendingEffects.map((p) => p.instance)).toEqual(['licence/late-payment']);
        // The licence sets its timer again for the next reminder date the clause gave.
        expect(host.state.timers.map((t) => [t.instance, t.timer.at])).toEqual([['licence', '2018-02-07T16:00:00.000Z']]);

        // The host delivers the reminder; its outcome goes back to the clause.
        expect(host.deliverEffects().every(isCommitted)).toBe(true);
        expect(host.stateOf<ILatePaymentState>('licence/late-payment')).toMatchObject({ remindersSent: 1, pendingReminders: [] });

        // A week later, the second reminder: no second late fee.
        host.advance({ days: 7 });
        const [second] = host.fireDueTimers();
        expect(isCommitted(second) && second.body.notifications).toEqual([]);
        expect(isCommitted(second) && OverdueHandled.is(second.body.response) && second.body.response.reminder).toBe(2);
        host.deliverEffects();

        // The third is the last the clause allows, so the licence sets no more timers.
        host.advance({ days: 7 });
        const [third] = host.fireDueTimers();
        expect(isCommitted(third) && OverdueHandled.is(third.body.response) && third.body.response.reminder).toBe(3);
        expect(host.state.timers).toEqual([]);
        host.deliverEffects();
        expect(host.stateOf<ILatePaymentState>('licence/late-payment')).toMatchObject({ remindersSent: 3, pendingReminders: [], settled: false });

        // The licensor records the fee paid: the clause clears, with the count of reminders it sent.
        const paid = host.send(RecordFeePayment.create({}), asLicensor(data));
        expect(isCommitted(paid)).toBe(true);
        if (!isCommitted(paid)) return;
        expect(FeeSettled.is(paid.body.response) && paid.body.response).toMatchObject({ amount: { unscaledValue: '10000' }, remindersSent: 3 });
        expect(host.stateOf<ICopyrightLicenseState>('licence').fee).toBe('PAID');
        expect(host.stateOf<ILatePaymentState>('licence/late-payment').settled).toBe(true);
        vector(host, 'licence-late-payment');
    });

    it('a fee paid on time cancels the timer, so no reminder is sent; only the licensor records it, and only while it is due', () => {
        const { host } = make(data);
        const early = host.send(RecordFeePayment.create({}), asLicensor(data));
        expect(isRejection(early) && FeePaymentRefused.is(early.body.response) && early.body.response.reason).toBe('NOT_DUE');

        host.send(PaymentRequest.create({}), asLicensee(data));
        const byLicensee = host.send(RecordFeePayment.create({}), asLicensee(data));
        expect(isRejection(byLicensee) && FeePaymentRefused.is(byLicensee.body.response) && byLicensee.body.response.reason).toBe('NOT_THE_LICENSOR');

        const paid = host.send(RecordFeePayment.create({}), asLicensor(data));
        expect(isCommitted(paid) && FeeSettled.is(paid.body.response) && paid.body.response).toMatchObject({ remindersSent: 0 });
        expect(host.state.timers).toEqual([]);
        host.at(DUE);
        expect(host.fireDueTimers()).toEqual([]);
        expect(host.stateOf<ILatePaymentState>('licence/late-payment')).toMatchObject({ remindersSent: 0, settled: true });
    });

    it('the late payment slot is optional: without a clause the overdue fee sends no reminder', () => {
        const { host } = make(data, scheduleData(), false);
        expect(Object.keys(host.state.states)).toEqual(['licence']);
        host.send(PaymentRequest.create({}), asLicensee(data));
        host.at(DUE);
        const [fired] = host.fireDueTimers();
        expect(isCommitted(fired) && fired.body).toMatchObject({ response: { $class: OverdueHandled.$class }, effects: [], notifications: [] });
        expect(isCommitted(fired) && OverdueHandled.is(fired.body.response) && fired.body.response.reminder).toBeUndefined();
        expect(host.state.timers).toEqual([]);
    });

    it('reads the sales to date from the sales registry for a royalty statement, and invoices only what was not invoiced before', () => {
        const { host } = make(data);
        // The host reads the licence's one host fact, keyed by its salesAccountId; the clause's fact is the licence's to provide.
        expect(host.agreement.hostReads.map((r) => [r.instance, r.name, r.key])).toEqual([['licence', 'sales', 'sales-account-001']]);

        // Only the licensor asks for a statement.
        const byLicensee = host.send(RoyaltyStatementRequest.create({}), asLicensee(data));
        expect(isRejection(byLicensee) && RoyaltyStatementRefused.is(byLicensee.body.response) && byLicensee.body.response.reason).toBe('NOT_THE_LICENSOR');

        // USD 50,000.00 of receipts: 10% is USD 5,000.00, all of it due.
        registry.sales = salesRecord(2000, usd('5000000'));
        const first = host.send(RoyaltyStatementRequest.create({}), asLicensor(data));
        expect(isCommitted(first)).toBe(true);
        if (!isCommitted(first)) return;
        expect(RoyaltyStatement.is(first.body.response) && first.body.response).toMatchObject({
            unitsSold: 2000, grossReceipts: { unscaledValue: '5000000' }, royaltyToDate: { unscaledValue: '500000' }, invoicedBefore: { unscaledValue: '0' }, due: { unscaledValue: '500000' },
        });
        expect(first.body.notifications).toHaveLength(1);
        expect(first.body.notifications[0]).toMatchObject({ $class: PaymentObligation.$class, obligor: { partyId: 'me' }, obligee: { partyId: 'myself' }, amount: { unscaledValue: '500000' }, description: 'Royalty on gross receipts' });
        // The fact is in the request's inputs, as the host read it; the licence keeps only what it invoiced.
        expect(host.session('inputs').steps.at(-1)!.inputs.facts).toEqual([{ instance: 'licence', name: 'sales', value: registry.sales }]);
        expect(host.stateOf<ICopyrightLicenseState>('licence').royaltiesInvoiced.unscaledValue).toBe('500000');

        // Nothing sold since: nothing is due, and nothing is notified.
        const again = host.send(RoyaltyStatementRequest.create({}), asLicensor(data));
        expect(isCommitted(again) && again.body.notifications).toEqual([]);
        expect(isCommitted(again) && RoyaltyStatement.is(again.body.response) && again.body.response.due.unscaledValue).toBe('0');

        // USD 80,000.09 to date: USD 8,000.00 royalty, rounded down to the cent; USD 3,000.00 of it new.
        registry.sales = salesRecord(3201, usd('8000009'));
        const later = host.send(RoyaltyStatementRequest.create({}), asLicensor(data));
        expect(isCommitted(later) && RoyaltyStatement.is(later.body.response) && later.body.response).toMatchObject({
            royaltyToDate: { unscaledValue: '800000' }, invoicedBefore: { unscaledValue: '500000' }, due: { unscaledValue: '300000' },
        });

        // A registry reporting in another currency is refused, not converted.
        registry.sales = SalesToDate.create({ salesAccountId: 'sales-account-001', unitsSold: 1, grossReceipts: PreciseAmount.create({ unscaledValue: '100', unit: MonetaryUnit.create({ currencyCode: 'GBP', scale: 2 }) }) });
        const gbp = host.send(RoyaltyStatementRequest.create({}), asLicensor(data));
        expect(isRejection(gbp) && RoyaltyStatementRefused.is(gbp.body.response) && gbp.body.response.reason).toBe('CURRENCY_MISMATCH');
        vector(host, 'licence-royalty');
    });

    it('the late payment clause reads what is owed from the licence, which provides it from its own state: no host read, nothing recorded', () => {
        const { host } = make(data);
        const read = host.agreement.instances.get('licence/late-payment')!.reads.get('outstanding');
        expect(read).toMatchObject({ factType: AmountOutstanding.$class, provider: 'licence' });
        expect(host.agreement.hostReads.some((r) => r.instance === 'licence/late-payment')).toBe(false);
        // The licence keeps no outstanding amount: the fact is worked out from `fee` when the clause reads it.
        expect(Object.keys(host.stateOf<ICopyrightLicenseState>('licence'))).not.toContain('outstanding');
    });

    it('agreement.json is this agreement: the licence with its late payment clause, and the schedule, with the hashes the engine computes', () => {
        const { host } = make(data);
        const record = host.session('agreement').agreement;
        const file = path.join(templateDir, 'agreement.json');
        if (RECORD) writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`);
        expect(canonicalJson(agreementSample)).toBe(canonicalJson(record));
        // The engine loads it as it stands, checking the agreement and document hashes it carries.
        const loaded = loadAgreement({ ...(agreementSample as unknown as AgreementSpec), archives: [archive, schedule, latePayment] });
        expect(loaded.hash).toBe((agreementSample as { agreementHash: string }).agreementHash);
        expect([...loaded.instances.keys()].sort()).toEqual(['licence', 'licence/late-payment', 'schedule']);
    });

    it('a change to the schedule alone voids an acceptance of the agreement; the licence\'s own terms version is unchanged', () => {
        const signed = make(data).host;
        const digest = acceptanceDigest('me', signed.agreement.agreementTermsHash);

        const amended = make(data, scheduleData({
            works: [...scheduleData().works, { $class: 'poc.accordproject.copyrightlicense.schedule@0.1.0.LicensedWork', title: 'A Second Work', description: 'more stuff' }],
        })).host;
        expect(amended.agreement.instances.get('licence')!.termsHash).toBe(signed.agreement.instances.get('licence')!.termsHash);
        expect(amended.agreement.agreementTermsHash).not.toBe(signed.agreement.agreementTermsHash);
        const refused = amended.send(AcceptLicence.create({ digest }), asLicensee(data));
        expect(isRejection(refused) && refused.body).toMatchObject({ response: { reason: 'TERMS_CHANGED' }, declinedBy: 'licence' });
    });

    it('needs its schedule: the reference is required, and only the schedule template fills it', () => {
        const spec = agreement(data);
        expect(() => loadAgreement({ ...spec, documents: [{ ...spec.documents[0]!, references: {} }, spec.documents[1]!] }))
            .toThrow(/Required document reference schedule of licence \(copyright-license-agreement-poc\) is not filled/);
        expect(() => loadAgreement({ ...spec, primary: 'schedule' })).toThrow(/is a text template \(no logic\): it is drafted, never made the primary document/);
    });
});

describe('requests describe themselves (@Returns, @Declines, @Emits)', () => {
    it('the late payment interface: PaymentOverdue answers ReminderSent, declines ReminderLimitReached and notifies LateFeeAccrued; PaymentSettled answers LatePaymentCleared; the licence\'s timer answers OverdueHandled', () => {
        const data = CopyrightLicenseData.create(sample as Parameters<typeof CopyrightLicenseData.create>[0]);
        const { host } = make(data);
        const models = host.agreement.models;
        expect(models.member(PaymentOverdue.$class)).toMatchObject({ returns: [ReminderSent.$class], declines: [ReminderLimitReached.$class, NothingOutstanding.$class], emits: [LateFeeAccrued.$class] });
        expect(models.member(PaymentSettled.$class)).toMatchObject({ declines: [], emits: [] });
        expect(models.member(FeeOverdue.$class)).toMatchObject({ returns: [OverdueHandled.$class], declines: [], operator: false });
        expect(models.member(RecordFeePayment.$class)).toMatchObject({ returns: [FeeSettled.$class], declines: [FeePaymentRefused.$class] });
    });

    it('PaymentRequest answers with PayOut, notifies a PaymentObligation, and never declines; AcceptLicence answers LicenceAccepted or declines AcceptanceRefused', () => {
        const data = CopyrightLicenseData.create(sample as Parameters<typeof CopyrightLicenseData.create>[0]);
        const { host } = make(data);
        expect(host.agreement.models.member(PaymentRequest.$class)).toEqual({
            request: PaymentRequest.$class,
            returns: [PayOut.$class],
            declines: [],
            emits: [PaymentObligation.$class],
            operator: false,
        });
        expect(host.agreement.models.member(AcceptLicence.$class)).toEqual({
            request: AcceptLicence.$class,
            returns: [LicenceAccepted.$class],
            declines: [AcceptanceRefused.$class],
            emits: [],
            operator: false,
        });
    });
});

// Named under 'copyright licence' so `npm run test:record` (-t 'copyright licence') records its vector too.
describe('copyright licence, expect: the revision a caller\'s decision rests on', () => {
    it('is optional; a request naming the licence at its current revision commits, one naming a revision it has moved from is StaleRevision', () => {
        const data = CopyrightLicenseData.create(sample as Parameters<typeof CopyrightLicenseData.create>[0]);
        const { host } = make(data);
        // The first payment request makes the fee due, so the licence moves from revision 0 to 1.
        const current = host.send(PaymentRequest.create({}), asLicensee(data), { expect: { revision: host.revisionOf('licence') } });
        expect(isCommitted(current)).toBe(true);
        expect(host.revisionOf('licence')).toBe(1);
        const stale = host.send(PaymentRequest.create({}), asLicensee(data), { expect: { instance: 'licence', revision: 0 } });
        expect(isRejection(stale)).toBe(true);
        if (!isRejection(stale)) return;
        expect(stale.body.response).toMatchObject({ $class: 'org.accordproject.runtime@1.0.0.StaleRevision', instance: 'licence', expected: 0, current: 1 });
        expect(stale.body.declinedBy).toBe('licence');
        vector(host, 'licence-expect');
    });
});

// Named under 'copyright licence' so `npm run test:record` records its vector too.
describe('copyright licence\'s late payment clause, alone', () => {
    it('with no parent to provide it, the clause reads what is owed from the host', () => {
        const party = (partyId: string, displayName: string) => ({ $class: 'org.accordproject.party@1.0.0.PartyRef' as const, partyId, displayName });
        const owed = { value: AmountOutstanding.create({ obligor: party('me', 'Me'), obligee: party('myself', 'Myself'), amount: usd('0') }) };
        const { host } = TestHost.make({
            agreementId: 'late-payment-alone',
            primary: 'late-payment',
            documents: [{ documentId: 'late-payment', template: { hash: latePayment.hash }, data: { ...latePaymentData(), utcOffset: '+00:00' } }],
            archives: [latePayment],
        }, { start: START, suppliers: { outstanding: () => owed.value } });
        expect(host.agreement.hostReads.map((r) => [r.instance, r.name])).toEqual([['late-payment', 'outstanding']]);

        // Nothing owed: declined.
        const nothing = host.send(PaymentOverdue.create({}), 'system');
        expect(isRejection(nothing) && NothingOutstanding.is(nothing.body.response)).toBe(true);

        // USD 40.00 owed since the 1st: a reminder for it, and the late fee.
        owed.value = AmountOutstanding.create({ ...owed.value, amount: usd('4000'), dueAt: '2018-01-01T00:00:00.000Z' });
        const reminded = host.send(PaymentOverdue.create({}), 'system');
        expect(isCommitted(reminded)).toBe(true);
        if (!isCommitted(reminded)) return;
        expect(ReminderSent.is(reminded.body.response) && reminded.body.response.reminder).toBe(1);
        expect(reminded.body.effects[0]).toMatchObject({ $class: PaymentReminder.$class, amount: { unscaledValue: '4000' } });
        expect(host.session('inputs').steps.at(-1)!.inputs.facts).toEqual([{ instance: 'late-payment', name: 'outstanding', value: owed.value }]);
        vector(host, 'late-payment-alone');
    });
});

describe('formatAmount', () => {
    const amount = (unscaledValue: string, scale: number) =>
        PreciseAmount.create({ unscaledValue, unit: MonetaryUnit.create({ currencyCode: 'USD', scale }) });

    it('places the decimal point at the unit scale', () => {
        expect(formatAmount(amount('10000', 2))).toBe('100.00 USD');
        expect(formatAmount(amount('5', 2))).toBe('0.05 USD');
        expect(formatAmount(amount('-125', 2))).toBe('-1.25 USD');
        expect(formatAmount(amount('7', 0))).toBe('7 USD');
    });
});

// Replays each recorded vector against the engine boundary itself: step 0 is
// instantiate, each later step is a trigger against the state the step before
// produced, and every step's result kind and semantic body must match the
// recording byte for byte (RFC 8785 canonical JSON). Provenance is not compared.
describe('recorded vectors replay', () => {
    const files = existsSync(vectorDir) ? readdirSync(vectorDir).filter((f) => f.endsWith('.json')).sort() : [];

    it('has vectors to replay', () => {
        expect(files.length).toBeGreaterThan(0);
    });

    for (const file of files) {
        it(`replays ${file}`, () => {
            const v = JSON.parse(readFileSync(path.join(vectorDir, file), 'utf8')) as SessionVector;
            expect(v.semantics).toBe('1.0.0-draft');
            // The vector names its archives by hash, so it cannot point at the wrong template.
            // Every archive it names is one of this folder's; the late payment clause alone needs only its own.
            const archives = [archive, schedule, latePayment].filter((a) => v.archives.includes(a.hash));
            expect(archives.map((a) => a.hash).sort()).toEqual(v.archives);
            // The vector's agreement carries its agreement and document hashes; the engine checks them as it loads it.
            const agreement = loadAgreement({ ...v.agreement, archives });
            expect(agreement.hash).toBe(v.agreement.agreementHash);

            let state: Parameters<typeof trigger>[1] | undefined;
            v.steps.forEach((step, i) => {
                const result = i === 0 ? instantiate(agreement, step.inputs) : trigger(agreement, state!, step.request!, step.inputs);
                const kind = isCommitted(result) ? 'Committed' : result.$class.endsWith('.Rejection') ? 'Rejection' : 'Fault';
                expect(kind, `step ${i}`).toBe(step.expect.result);
                if (kind !== 'Fault') expect(canonicalJson((result as { body: unknown }).body), `step ${i}`).toBe(canonicalJson(step.expect.body));
                if (isCommitted(result)) state = result.body.state;
            });
        });
    }
});
