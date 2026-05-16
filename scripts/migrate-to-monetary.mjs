#!/usr/bin/env node
// Migrates a template to use org.accordproject.money@0.3.0.MonetaryAmount
// for fields whose names look monetary.
//
// What it does, per template:
//   1. Reads model/model.cto (or model/clause.cto), bumps the template
//      namespace minor version, adds the MonetaryAmount import if needed,
//      and retypes matching `o Double <name>` declarations to MonetaryAmount.
//   2. Drops the local @models cache for money@0.3.0 next to the other
//      cached external models, so offline builds work.
//   3. Rewrites the top-level $class in sample.json / request.json /
//      state.json to the new namespace, and wraps every Double value whose
//      key matches a converted field name in a versioned MonetaryAmount
//      object using a configurable default currency.
//   4. Bumps package.json `version`.
//
// What it does NOT do:
//   - Edit logic/logic.ts, logic/logic.test.ts, text/grammar.tem.md,
//     contract.json, or regenerate logic/generated/. Those require
//     per-template judgement and are handled by hand after this script
//     runs. The script exists to do the bulk mechanical work and to make
//     the diff reviewable.
//
// Flags:
//   --template <name>   target a single template (default: all)
//   --currency <code>   default currency for wrapping values (default: USD)
//   --dry               print actions without writing
//
// FIELDS_BY_TEMPLATE below is the curated list — only names listed are
// converted, so we don't accidentally retype things like interest rates
// or percentages.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, copyFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SRC = join(ROOT, 'src');

const MONEY_NS = 'org.accordproject.money@0.3.0';
const MONEY_FQN = `${MONEY_NS}.MonetaryAmount`;
const MONEY_URL = 'https://models.accordproject.org/money@0.3.0.cto';
const MONEY_IMPORT = `import ${MONEY_FQN} from ${MONEY_URL}`;
const MONEY_CACHE_FILE = '@models.accordproject.org.money@0.3.0.cto';

// Curated per-template list of Double field names to convert. Anything not
// in this list is left as Double. Built from an audit pass.
const FIELDS_BY_TEMPLATE = {
    'minilatedeliveryandpenalty': ['goodsValue', 'penalty'],
    'minilatedeliveryandpenalty-capped': ['goodsValue', 'penalty'],
    'minilatedeliveryandpenalty-payment': ['goodsValue', 'penalty', 'amount'],
    'latedeliveryandpenalty': ['amount', 'penalty', 'goodsValue'],
    'latedeliveryandpenalty-else': ['amount', 'penalty', 'goodsValue'],
    'latedeliveryandpenalty-optional': ['amount', 'penalty', 'goodsValue'],
    'latedeliveryandpenalty-optional-this': ['amount', 'penalty', 'goodsValue'],
    'simplelatedeliveryandpenalty': ['amount', 'penalty', 'goodsValue'],
    'latedeliveryandpenalty-currency-conversion': ['amount', 'penalty', 'goodsValue'],
    'lateinvoicewithpayment': ['amount', 'amountDue'],
    'full-payment-upon-demand': ['amount'],
    'full-payment-upon-signature': ['amount'],
    'payment-upon-delivery': ['amount', 'totalAmount', 'costOfGoods', 'deliveryFee'],
    'payment-upon-iot': ['amount', 'amountPerUnit'],
    'payment-upon-signature': ['amount'],
    'one-time-payment-tr': ['amount', 'totalPurchasePrice'],
    'promissory-note-md': ['amount', 'amountPaid', 'outstandingBalance'],
    'supplyagreement': ['amount', 'paid', 'unitPrice'],
    'supplyagreement-perishable-goods': ['penalty', 'totalPrice', 'unitPrice'],
    'supply-agreement-loc': ['unitPrice', 'unitPriceOfEachProduct', 'freightCharges', 'importerLOCAmount'],
    'volumediscount': ['netAnnualChargeVolume'],
    'volumediscountolist': ['netAnnualChargeVolume'],
    'volumediscountulist': ['netAnnualChargeVolume'],
    'perishable-goods': ['penalty', 'totalPrice', 'totalPaid', 'unitPrice'],
    'fragile-goods': ['paymentAmount'],
    'fixed-interests': ['loanAmount'],
    'fixed-interests-static': ['loanAmount', 'monthlyPayment'],
    'installment-sale': ['amount', 'balance', 'balance_remaining', 'total_paid', 'MIN_PAYMENT', 'TOTAL_DUE_BEFORE_CLOSING'],
    'interest-rate-swap': ['notionalAmount', 'outstandingBalance'],
    'ip-payment': ['totalAmount'],
    'rental-deposit': ['amount', 'balance', 'depositAmount'],
    'rental-deposit-with': ['amount', 'balance', 'depositAmount'],
    'roommate': ['depositAmount', 'rentAmount'],
    'saft': ['purchaseAmount', 'totalInvested'],
    'safte': ['amount', 'equityAmount', 'purchaseAmount', 'sharePrice', 'tokenPrice'],
    'servicelevelagreement': ['amount', 'last11MonthCharge', 'monthlyCharge'],
    'eat-apples': ['amount', 'price'],
    'copyright-license': ['amount'],
    'car-rental-tr': ['amount'],
    'docusign-po-failure': ['penaltyAmount', 'repeatedFailureCompensationAmount'],
    'project-information': ['budgetAmount'],
};

const args = process.argv.slice(2);
const opts = { template: null, currency: 'USD', dry: false };
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--template') opts.template = args[++i];
    else if (args[i] === '--currency') opts.currency = args[++i];
    else if (args[i] === '--dry') opts.dry = true;
}

function bumpMinor(version) {
    const m = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!m) throw new Error(`unexpected version: ${version}`);
    return `${m[1]}.${Number(m[2]) + 1}.0`;
}

function bumpNamespace(line) {
    // namespace foo@1.2.3 → namespace foo@1.3.0
    return line.replace(/(namespace\s+\S+@)(\d+)\.(\d+)\.(\d+)/, (_, p, maj, min) => `${p}${maj}.${Number(min) + 1}.0`);
}

function findCtoFile(modelDir) {
    if (existsSync(join(modelDir, 'model.cto'))) return join(modelDir, 'model.cto');
    if (existsSync(join(modelDir, 'clause.cto'))) return join(modelDir, 'clause.cto');
    return null;
}

function updateModelCto(ctoPath, fields) {
    let src = readFileSync(ctoPath, 'utf8');
    const before = src;
    let oldNs, newNs;

    // bump namespace
    src = src.replace(/^(namespace\s+(\S+)@)(\d+)\.(\d+)\.(\d+)/m, (m, prefix, ns, maj, min) => {
        oldNs = `${ns}@${maj}.${min}.0`;
        newNs = `${ns}@${maj}.${Number(min) + 1}.0`;
        return `${prefix}${maj}.${Number(min) + 1}.0`;
    });
    if (!newNs) throw new Error(`no namespace in ${ctoPath}`);

    // add money import if not present
    if (!src.includes(MONEY_FQN)) {
        // insert after the last import line
        const importLines = [...src.matchAll(/^import\s+.+$/gm)];
        if (importLines.length) {
            const last = importLines[importLines.length - 1];
            const insertAt = last.index + last[0].length;
            src = src.slice(0, insertAt) + `\n${MONEY_IMPORT}` + src.slice(insertAt);
        } else {
            // no imports — put it right after the namespace declaration
            src = src.replace(/(namespace[^\n]+\n)/, `$1\n${MONEY_IMPORT}\n`);
        }
    }

    // retype matching fields
    for (const f of fields) {
        const re = new RegExp(`(\\bo\\s+)Double(\\s+${f}\\b)`, 'g');
        src = src.replace(re, `$1MonetaryAmount$2`);
    }

    return { ctoPath, before, after: src, oldNs, newNs };
}

function rewriteJson(filePath, fields, oldNs, newNs, currency) {
    if (!existsSync(filePath)) return null;
    const raw = readFileSync(filePath, 'utf8');
    let data;
    try {
        data = JSON.parse(raw);
    } catch {
        return null;
    }

    let touched = false;

    // Recursively walk. Only wrap a matching field when its containing
    // object's $class belongs to the template's own namespace — otherwise
    // we'd corrupt nested external types like Duration.amount.
    function walk(obj) {
        if (Array.isArray(obj)) {
            obj.forEach((v, i) => obj[i] = walk(v));
            return obj;
        }
        if (obj && typeof obj === 'object') {
            if (typeof obj.$class === 'string') {
                if (obj.$class.startsWith(oldNs + '.')) {
                    obj.$class = newNs + obj.$class.slice(oldNs.length);
                    touched = true;
                }
                if (obj.$class === 'org.accordproject.money.MonetaryAmount') {
                    obj.$class = MONEY_FQN;
                    touched = true;
                }
            }
            const ownerInTemplateNs = typeof obj.$class === 'string'
                && obj.$class.startsWith(newNs + '.');
            for (const k of Object.keys(obj)) {
                if (ownerInTemplateNs && fields.includes(k) && typeof obj[k] === 'number') {
                    obj[k] = {
                        $class: MONEY_FQN,
                        doubleValue: obj[k],
                        currencyCode: currency,
                    };
                    touched = true;
                } else {
                    obj[k] = walk(obj[k]);
                }
            }
        }
        return obj;
    }
    walk(data);

    if (!touched) return null;
    const trailing = raw.endsWith('\n') ? '\n' : '';
    return { filePath, after: JSON.stringify(data, null, 2) + trailing };
}

function migrateTemplate(name, fields) {
    const dir = join(SRC, name);
    if (!existsSync(dir)) return { name, error: 'directory not found' };

    const ctoPath = findCtoFile(join(dir, 'model'));
    if (!ctoPath) return { name, error: 'no model.cto/clause.cto' };

    const cto = updateModelCto(ctoPath, fields);

    const cacheTarget = join(dir, 'model', MONEY_CACHE_FILE);
    const cacheSource = join(SRC, 'promissory-note', 'model', MONEY_CACHE_FILE);
    const needsCache = !existsSync(cacheTarget);

    const jsonResults = [];
    for (const j of ['sample.json', 'request.json', 'state.json', 'contract.json']) {
        const r = rewriteJson(join(dir, j), fields, cto.oldNs, cto.newNs, opts.currency);
        if (r) jsonResults.push(r);
    }

    const pkgPath = join(dir, 'package.json');
    let pkgResult = null;
    if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        if (pkg.version) {
            const newVersion = bumpMinor(pkg.version);
            pkg.version = newVersion;
            pkgResult = { filePath: pkgPath, after: JSON.stringify(pkg, null, 4) + '\n' };
        }
    }

    if (!opts.dry) {
        if (cto.before !== cto.after) writeFileSync(cto.ctoPath, cto.after);
        if (needsCache && existsSync(cacheSource)) copyFileSync(cacheSource, cacheTarget);
        for (const r of jsonResults) writeFileSync(r.filePath, r.after);
        if (pkgResult) writeFileSync(pkgResult.filePath, pkgResult.after);
    }

    return {
        name,
        ns: { from: cto.oldNs, to: cto.newNs },
        files: {
            model: cto.before !== cto.after,
            cache: needsCache,
            json: jsonResults.map((r) => r.filePath.replace(dir + '/', '')),
            pkg: !!pkgResult,
        },
    };
}

const targets = opts.template
    ? [opts.template]
    : readdirSync(SRC).filter((n) => {
        const p = join(SRC, n);
        return statSync(p).isDirectory() && existsSync(join(p, 'package.json')) && FIELDS_BY_TEMPLATE[n];
    });

for (const name of targets) {
    const fields = FIELDS_BY_TEMPLATE[name];
    if (!fields) {
        console.log(`skip: ${name} (no fields configured)`);
        continue;
    }
    try {
        const r = migrateTemplate(name, fields);
        if (r.error) console.error(`error: ${name}: ${r.error}`);
        else console.log(`${name}: ${r.ns.from} -> ${r.ns.to}  json=[${r.files.json.join(',')}]  cache=${r.files.cache}  pkg=${r.files.pkg}`);
    } catch (e) {
        console.error(`error: ${name}: ${e.message}`);
    }
}
