import pkg from '@accordproject/cicero-core';
const { Template } = pkg;
import { readdirSync, existsSync, readFileSync, writeFileSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const templates = readdirSync(SRC).filter(name => {
    const p = join(SRC, name);
    return statSync(p).isDirectory() && existsSync(join(p, 'package.json'));
});

// Split a fully-qualified $class string into { ns, type }. Handles both
// versioned ("org.foo@1.0.0.Type") and unversioned ("org.foo.Type") forms.
function splitFqn(fqn) {
    const at = fqn.indexOf('@');
    if (at >= 0) {
        const dot = fqn.indexOf('.', at);
        return { ns: fqn.slice(0, dot), type: fqn.slice(dot + 1) };
    }
    const dot = fqn.lastIndexOf('.');
    return { ns: fqn.slice(0, dot), type: fqn.slice(dot + 1) };
}

function stripVersion(ns) {
    const at = ns.indexOf('@');
    return at >= 0 ? ns.slice(0, at) : ns;
}

// Build a map { unversionedNs -> [versionedNs...] } from a template's
// ModelManager so we can rewrite stale $class values.
function buildNsMap(template) {
    const mm = template.getModelManager();
    const map = new Map();
    for (const mf of mm.getModelFiles()) {
        const ns = mf.getNamespace();
        const base = stripVersion(ns);
        if (!map.has(base)) map.set(base, []);
        map.get(base).push(ns);
    }
    return map;
}

function rewriteClasses(obj, nsMap, log) {
    if (Array.isArray(obj)) return obj.map(x => rewriteClasses(x, nsMap, log));
    if (obj && typeof obj === 'object') {
        if (typeof obj.$class === 'string') {
            const { ns, type } = splitFqn(obj.$class);
            if (!ns.includes('@')) {
                const candidates = nsMap.get(ns) || [];
                const match = candidates.find(v => true) || nsMap.get(stripVersion(ns))?.[0];
                if (match && match !== ns) {
                    const next = `${match}.${type}`;
                    log.push(`${obj.$class} -> ${next}`);
                    obj.$class = next;
                }
            }
        }
        for (const k of Object.keys(obj)) obj[k] = rewriteClasses(obj[k], nsMap, log);
    }
    return obj;
}

let fixed = 0, ok = 0, skipped = 0, failed = 0;

for (const name of templates) {
    const dir = join(SRC, name);
    const sampleJsonPath = join(dir, 'sample.json');
    if (!existsSync(sampleJsonPath)) { skipped++; continue; }
    try {
        const template = await Template.fromDirectory(dir);
        const tmFqn = template.getTemplateModel().getFullyQualifiedName();
        const nsMap = buildNsMap(template);
        const raw = readFileSync(sampleJsonPath, 'utf8');
        const before = raw;
        const data = JSON.parse(raw);
        data.$class = tmFqn;
        const log = [];
        rewriteClasses(data, nsMap, log);

        // The model's identifier field (e.g. clauseId, contractId) must be
        // populated. Older sample.json files often carry the wrong id field
        // name from a prior incarnation of the template; fix from $identifier.
        const tmDecl = template.getTemplateModel();
        const idField = tmDecl.getIdentifierFieldName?.() ?? tmDecl.idField;
        if (idField && data[idField] === undefined) {
            const fallback = data.$identifier ?? data.clauseId ?? data.contractId;
            if (fallback) {
                data[idField] = fallback;
                log.push(`id field: set ${idField} = ${fallback}`);
            }
        }
        for (const stale of ['clauseId', 'contractId']) {
            if (stale !== idField && data[stale] !== undefined) {
                delete data[stale];
                log.push(`id field: removed stale ${stale}`);
            }
        }
        const trailing = raw.endsWith('\n') ? '\n' : '';
        const next = JSON.stringify(data, null, 2) + trailing;
        if (next === before) { ok++; continue; }
        writeFileSync(sampleJsonPath, next);
        console.log(`fixed: ${name}`);
        for (const l of log) console.log(`  ${l}`);
        fixed++;
    } catch (e) {
        console.error(`failed: ${name}: ${e.message}`);
        failed++;
    }
}

console.log(`\nfixed=${fixed} already-ok=${ok} no-sample=${skipped} failed=${failed}`);
