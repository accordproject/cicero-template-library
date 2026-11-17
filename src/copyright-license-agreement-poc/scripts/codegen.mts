/**
 * Generates logic/generated/<namespace>.ts, one module per namespace: the
 * template's own (model/) and the @1.0.0 base drafts it imports, with the next-major engine's codegen rules: for each type a
 * TypeScript interface I<Name> and a factory <Name> with `create` (concrete
 * types) and `is` (every type, following supertypes), plus the supertype
 * table `is` uses. Decorator declarations (concepts extending
 * concerto.decorator@1.0.0.Decorator: the runtime's Returns, Declines and
 * Emits) are skipped, as the engine's codegen skips them: they describe a
 * request type and are never values.
 *
 * DRAFT for the next major release. The engine and its Concerto loader are
 * not published yet: they are read from a checkout of the next-major engine,
 * ACCORD_NEXT_ENGINE (default below). Run with `npm run compile`, using that
 * checkout's tsx.
 *
 * The base drafts are read from the engine checkout (models/accordproject/),
 * the same files the engine loads beside every archive, so the generated
 * types cannot drift from the namespaces the engine runs. They are not
 * copied into model/: the engine would then count them among the
 * template's own namespaces (see NEXT-MAJOR.md).
 *
 * It also generates the schedule's namespace (schedule/model/, the text
 * template the licence uses as a document of its own); the late payment
 * clause's (../late-payment-clause-poc/model/: its own namespace and the
 * latepayment.api interface it implements), into the clause's own
 * logic/generated as well, with the base drafts it uses; and
 * logic/generated/documents.ts: the type of `self.documents` from the
 * manifest's "documents" (CopyrightLicenseAgreementPocDocuments), by the
 * engine's own rule (src/engine/codegen-documents.ts in the checkout).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const templateDir = join(here, '..');
const engineRoot = process.env.ACCORD_NEXT_ENGINE ?? '/Users/matt/dev/sbx/bank-product-template-poc/.claude/worktrees/next-major';

// The engine's Concerto declarations, as far as this script uses them (src/engine/models.ts Declaration, Property).
type Declaration = any;
type Property = any;

const { modelsFor, T } = (await import(pathToFileURL(join(engineRoot, 'src/engine/models.ts')).href)) as {
    modelsFor: (files: { path: string; cto: string }[]) => any;
    T: Record<'Emitted' | 'TimerFiring', string>;
};

const { documentsType } = (await import(pathToFileURL(join(engineRoot, 'src/engine/codegen-documents.ts')).href)) as {
    documentsType: (o: Record<string, unknown>) => string[];
};

const modelFiles = (dir: string) => readdirSync(join(templateDir, dir)).filter((f) => f.endsWith('.cto')).sort()
    .map((f) => ({ path: `${dir}/${f}`, cto: readFileSync(join(templateDir, dir, f), 'utf8') }));
// The licence's own model, its schedule's (a template of its own, in
// schedule/), and its late payment clause's (a template of its own, beside
// the licence), whose interface the licence's logic calls.
const clauseDir = '../late-payment-clause-poc';
const licenceModel = modelFiles('model');
const scheduleModel = modelFiles('schedule/model');
const clauseModel = modelFiles(`${clauseDir}/model`);
const own = [...licenceModel, ...scheduleModel, ...clauseModel];
const baseDir = join(engineRoot, 'models/accordproject');
const base = readdirSync(baseDir).filter((f) => f.endsWith('.cto')).sort()
    .map((f) => ({ path: `models/accordproject/${f}`, cto: readFileSync(join(baseDir, f), 'utf8') }));

const nsOf = (cto: string) => /^\s*namespace\s+(\S+)/m.exec(cto)?.[1];

const m = modelsFor([...base, ...own]);
const namespaces = [...own, ...base].map((o) => nsOf(o.cto)!).sort();
const isAbstract = (d: Declaration) => typeof d.isAbstract === 'function' && d.isAbstract();
const isSystem = (fqn: string | null | undefined) => !fqn || fqn.startsWith('concerto@') || fqn.startsWith('concerto.');
const PRIMITIVES: Record<string, string> = {
    String: 'string', DateTime: 'string', Boolean: 'boolean', Integer: 'number', Long: 'number', Double: 'number',
};

const kindOf = (d: Declaration) => d.isEnum() ? 'enum' : d.isMapDeclaration() ? 'map' : d.isTransaction() ? 'transaction' : d.isEvent() ? 'event' : 'concept';

/** Fields the engine sets, which create() does not require. */
function engineFields(fqn: string): string[] {
    if (m.isA(fqn, T.Emitted)) return ['id', 'revision', 'ordinal'];
    if (m.isA(fqn, T.TimerFiring)) return ['timerId', 'dueAt'];
    return [];
}

let total = 0;
/** Writes one module per namespace into <dir>/logic/generated: `wanted` and every namespace they use, transitively. */
function generate(dir: string, wanted: string[]): number {
const outDir = join(templateDir, dir, 'logic/generated');
mkdirSync(outDir, { recursive: true });
const closure = new Set<string>();
const visit = (ns: string) => {
    if (closure.has(ns) || !namespaces.includes(ns)) return;
    closure.add(ns);
    for (const d of m.namespaceDeclarations(ns)) {
        const sup = d.getSuperType?.();
        if (sup && !isSystem(sup)) visit(m.declaration(sup).getNamespace());
        if (d.isMapDeclaration?.() || d.isEnum?.()) continue;
        for (const p of d.getProperties?.() ?? []) {
            if (p.isPrimitive()) continue;
            const fqn = p.getFullyQualifiedTypeName();
            if (!isSystem(fqn)) visit(m.declaration(fqn).getNamespace());
        }
    }
};
wanted.forEach(visit);
const before = total;
for (const ns of [...closure].sort()) {
    const decls = m.namespaceDeclarations(ns)
        .filter((d: Declaration) => !m.isDecorator(d.getFullyQualifiedName()))
        .sort((a: Declaration, b: Declaration) => a.getName().localeCompare(b.getName()));
    const imports = new Map<string, Set<string>>();
    const ref = (fqn: string): string => {
        const d = m.declaration(fqn);
        if (d.getNamespace() !== ns) {
            if (!namespaces.includes(d.getNamespace())) throw new Error(`${ns} uses ${fqn}, whose namespace is neither the template's nor a base draft`);
            const s = imports.get(d.getNamespace()) ?? new Set<string>();
            s.add(`I${d.getName()}`);
            imports.set(d.getNamespace(), s);
        }
        return `I${d.getName()}`;
    };
    const tsType = (p: Property): string => {
        let t: string;
        if (p.constructor.name.includes('Relationship')) t = 'string';
        else if (p.isPrimitive()) t = PRIMITIVES[p.getType()] ?? 'unknown';
        else {
            const fqn = p.getFullyQualifiedTypeName();
            t = isSystem(fqn) ? 'unknown' : ref(fqn);
        }
        return p.isArray() ? `${t}[]` : t;
    };

    const body: string[] = [];
    const supertypes: Record<string, string | null> = {};
    for (const d of decls) {
        const name = d.getName();
        const fqn = d.getFullyQualifiedName();
        body.push(`/** ${fqn} (${isAbstract(d) ? 'abstract ' : ''}${kindOf(d)}) */`);
        if (d.isEnum()) {
            const values = d.getOwnProperties().map((p) => `'${p.getName()}'`);
            body.push(`export type I${name} = ${values.join(' | ')};`);
            body.push(`export const ${name} = { ${d.getOwnProperties().map((p) => `${p.getName()}: '${p.getName()}'`).join(', ')} } as const;`, '');
            continue;
        }
        if (d.isMapDeclaration()) {
            const valueType = d.getValue().getType() as string;
            if (PRIMITIVES[valueType]) {
                body.push(`export type I${name} = Record<string, ${PRIMITIVES[valueType]}>;`, '');
                continue;
            }
            const value = d.getModelFile().getFullyQualifiedTypeName(valueType);
            body.push(`export type I${name} = Record<string, ${isSystem(value) ? 'unknown' : ref(value)}>;`, '');
            continue;
        }
        const sup = d.getSuperType();
        supertypes[fqn] = isSystem(sup) ? null : sup;
        if (!isSystem(sup)) ref(sup!);
        const seen = new Set<string>();
        const fields: string[] = [];
        for (const p of d.getProperties()) {
            const pname = p.getName();
            if (seen.has(pname)) continue;
            seen.add(pname);
            if (pname === '$timestamp') {
                fields.push('    $timestamp?: string;');
                continue;
            }
            if (pname.startsWith('$')) continue;
            fields.push(`    ${pname}${p.isOptional() ? '?' : ''}: ${tsType(p)};`);
        }
        body.push(`export interface I${name} {`, `    $class: ${isAbstract(d) ? 'string' : `'${fqn}'`};`, ...fields, '}');
        if (isAbstract(d)) body.push(`export const ${name} = abstractType<I${name}>('${fqn}');`, '');
        else {
            const engine = engineFields(fqn);
            const o = engine.length ? `, ${engine.map((f) => `'${f}'`).join(' | ')}` : '';
            body.push(`export const ${name} = conceptType<I${name}${o}>('${fqn}');`, '');
        }
        total++;
    }
    body.push('registerSupertypes({');
    for (const [k, v] of Object.entries(supertypes)) body.push(`    '${k}': ${v ? `'${v}'` : 'null'},`);
    body.push('});', '');

    const head = [
        `// Generated by scripts/codegen.mts from ${ns}. Do not edit.`,
        "import { abstractType, conceptType, registerSupertypes } from '@accordproject/template-engine/factories';",
        // Each namespace this one uses registers its own supertypes, so `is` follows the whole lineage.
        ...[...imports.keys()].sort().map((dep) => `import './${dep}.js';`),
        ...[...imports.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([dep, names]) => `import type { ${[...names].sort().join(', ')} } from './${dep}.js';`),
        '',
    ];
    writeFileSync(join(outDir, `${ns}.ts`), [...head, ...body].join('\n'));
}
return total - before;
}

// The licence uses its own namespace, the schedule's, the clause's interface (not the clause's own namespace), and the base drafts.
const clauseOwn = clauseModel.map((f) => nsOf(f.cto)!).filter((ns) => !ns.includes('.api@'));
generate('.', namespaces.filter((ns) => !clauseOwn.includes(ns)));
// The clause uses its own namespace and its interface, and the base drafts they import.
const clauseTypes = generate(clauseDir, clauseModel.map((f) => nsOf(f.cto)!));
// ── self.documents ──────────────────────────────────────────────────────

type Pkg = { name: string; version: string; accordproject: { implements?: Record<string, string>; documents?: Record<string, unknown> } };
const readPkg = (dir: string) => JSON.parse(readFileSync(join(templateDir, dir, 'package.json'), 'utf8')) as Pkg;
const licence = readPkg('.');
const schedule = readPkg('schedule');
const templates = [
    { pkg: licence, dir: '.', files: licenceModel },
    { pkg: schedule, dir: 'schedule', files: scheduleModel },
].map(({ pkg, dir, files }) => ({
    name: pkg.name, version: pkg.version, implements: pkg.accordproject.implements ?? {},
    logic: existsSync(join(templateDir, dir, 'logic/logic.ts')),
    namespaces: files.map((f) => nsOf(f.cto)!),
}));
const docImports = new Map<string, Set<string>>();
const docLines = documentsType({
    owner: licence.name, documents: licence.accordproject.documents ?? {}, models: m, templates,
    typeName: (fqn: string) => {
        const d = m.declaration(fqn);
        const s = docImports.get(d.getNamespace()) ?? new Set<string>();
        s.add(`I${d.getName()}`);
        docImports.set(d.getNamespace(), s);
        return `I${d.getName()}`;
    },
    // This codegen emits no API types: a document with logic would be typed with `never` for its requests.
    apiName: () => undefined,
});
writeFileSync(join(templateDir, 'logic/generated', 'documents.ts'), [
    '// Generated by scripts/codegen.mts from the manifest\'s "documents". Do not edit.',
    "import type { DocumentHandle, TextDocumentHandle } from '@accordproject/template-engine';",
    ...[...docImports.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([dep, names]) => `import type { ${[...names].sort().join(', ')} } from './${dep}.js';`),
    '',
    ...docLines,
].join('\n'));

console.log(`Generated ${total - clauseTypes} types in ${namespaces.length} namespaces, and the documents type, into logic/generated, and ${clauseTypes} types into ${clauseDir}/logic/generated`);
