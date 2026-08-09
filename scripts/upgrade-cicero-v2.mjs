#!/usr/bin/env node
// Upgrades active templates to the latest Cicero v2 toolchain.
//
// What it does:
//   1. Bumps the @accordproject/* dependencies in the root package.json to
//      the pinned TARGET_VERSIONS below.
//   2. For every active template (package.json `archived` !== true):
//      - normalizes `accordproject.cicero` to `^2.0.0`
//      - removes any stray top-level `engines` block (legacy pre-v2 templates
//        declared engines.cicero directly; none currently do, but this keeps
//        the script correct if one reappears via a bad merge/copy-paste)
//      - bumps the template's own `version` (default: patch)
//   Archived templates are skipped by default since they're retired and no
//   longer expected to compile (see test/render.test.mjs).
//
// What it does NOT do:
//   - Run `npm install`, regenerate lockfiles, or run `npm run compile`.
//   - Touch model/*.cto, logic/*.ts, or sample.json — this is a pure
//     tooling/dependency bump, not a model migration.
//   - Verify the upgrade actually works. @accordproject/concerto-codegen is
//     jumping a major version (4.x -> 5.x) as a transitive pull-in via
//     concerto-cli, which regenerates logic/generated/. After applying,
//     run `npm install && npm run compile --workspaces --if-present &&
//     npm test` and diff logic/generated/ before committing.
//
// Flags:
//   --dry                 print planned changes without writing (default: write)
//   --template <list>     comma-separated template names to target (default: all active)
//   --include-archived    also update archived templates
//   --bump <level>        patch|minor|major bump for template `version` (default: patch)
//
// Target versions below were the latest @accordproject/* v2-line releases on
// npm as of 2026-08-09 (checked via `npm view <pkg> version`). Re-verify
// before relying on this list if it's been a while — re-run:
//   for p in $(node -e "console.log(Object.keys(require('./scripts/upgrade-cicero-v2.mjs').TARGET_VERSIONS||{}).join(' '))"); do npm view "$p" version; done
// (or just `npm view <pkg> version` per package below).

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SRC = join(ROOT, 'src');

// Pinned deliberately (not auto-fetched) so the diff this script produces is
// exactly what gets reviewed — bumping this list is itself a reviewable change.
const TARGET_VERSIONS = {
    '@accordproject/cicero-core': '2.1.1',
    '@accordproject/concerto-cli': '4.0.2',
    '@accordproject/concerto-core': '4.1.5',
    // major bump 4.1.3 -> 5.1.0: concerto-cli@4.0.2 already pulls
    // concerto-codegen@5.1.0 transitively, so pin here to match rather than
    // let npm resolve two majors side by side. Verify `npm run compile`
    // output is unchanged (or intentionally different) before merging.
    '@accordproject/concerto-codegen': '5.1.0',
    '@accordproject/concerto-util': '4.1.5',
    // already latest on the v2 line; listed for completeness / future reruns
    '@accordproject/markdown-cicero': '1.0.1',
    '@accordproject/markdown-html': '1.0.1',
    '@accordproject/template-engine': '4.0.0',
};

const TARGET_CICERO_RANGE = '^2.0.0';

const args = process.argv.slice(2);
const opts = { dry: false, template: null, includeArchived: false, bump: 'patch' };
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry') opts.dry = true;
    else if (args[i] === '--template') opts.template = args[++i].split(',').map((s) => s.trim());
    else if (args[i] === '--include-archived') opts.includeArchived = true;
    else if (args[i] === '--bump') opts.bump = args[++i];
    else {
        console.error(`unknown flag: ${args[i]}`);
        process.exit(1);
    }
}
if (!['patch', 'minor', 'major'].includes(opts.bump)) {
    console.error(`--bump must be patch|minor|major, got: ${opts.bump}`);
    process.exit(1);
}

function bumpVersion(version, level) {
    const m = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!m) throw new Error(`unexpected version: ${version}`);
    const major = Number(m[1]);
    const minor = Number(m[2]);
    const patch = Number(m[3]);
    if (level === 'major') return `${major + 1}.0.0`;
    if (level === 'minor') return `${major}.${minor + 1}.0`;
    return `${major}.${minor}.${patch + 1}`;
}

function updateRootPackage() {
    const pkgPath = join(ROOT, 'package.json');
    const raw = readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(raw);
    const changes = [];

    for (const [dep, target] of Object.entries(TARGET_VERSIONS)) {
        const current = pkg.dependencies?.[dep];
        if (!current) {
            console.warn(`root package.json: ${dep} not found in dependencies, skipping`);
            continue;
        }
        if (current !== target) {
            changes.push({ dep, from: current, to: target });
            pkg.dependencies[dep] = target;
        }
    }

    console.log('\n== root package.json ==');
    if (changes.length === 0) {
        console.log('  no dependency changes needed (already at target versions)');
    } else {
        for (const c of changes) console.log(`  ${c.dep}: ${c.from} -> ${c.to}`);
    }
    console.log(`  engines.node: ${pkg.engines?.node ?? '(none)'} (left unchanged — no upstream engines requirement forces a bump; confirm manually if desired)`);

    if (!opts.dry && changes.length > 0) {
        writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    }
    return changes;
}

function discoverTemplates() {
    let names = readdirSync(SRC).filter((n) => {
        const p = join(SRC, n);
        return statSync(p).isDirectory() && existsSync(join(p, 'package.json'));
    });
    if (opts.template) {
        const wanted = new Set(opts.template);
        names = names.filter((n) => wanted.has(n));
    }
    return names;
}

function updateTemplate(name) {
    const pkgPath = join(SRC, name, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

    if (pkg.archived === true && !opts.includeArchived) {
        return { name, skipped: 'archived' };
    }

    const changes = [];

    if (!pkg.accordproject) pkg.accordproject = {};
    if (pkg.accordproject.cicero !== TARGET_CICERO_RANGE) {
        changes.push(`accordproject.cicero: ${pkg.accordproject.cicero ?? '(none)'} -> ${TARGET_CICERO_RANGE}`);
        pkg.accordproject.cicero = TARGET_CICERO_RANGE;
    }

    if (pkg.engines) {
        changes.push(`removed stray top-level engines block: ${JSON.stringify(pkg.engines)}`);
        delete pkg.engines;
    }

    const oldVersion = pkg.version;
    const newVersion = bumpVersion(oldVersion, opts.bump);
    changes.push(`version: ${oldVersion} -> ${newVersion}`);
    pkg.version = newVersion;

    if (!opts.dry && changes.length > 0) {
        writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n');
    }

    return { name, changes };
}

console.log(`mode: ${opts.dry ? 'DRY RUN (no files written)' : 'APPLY (writing changes)'}, bump=${opts.bump}${opts.includeArchived ? ', including archived' : ''}`);

const rootChanges = updateRootPackage();

const templates = discoverTemplates();
console.log(`\n== templates (${templates.length} discovered) ==`);
let updated = 0;
let skipped = 0;
for (const name of templates) {
    const result = updateTemplate(name);
    if (result.skipped) {
        skipped++;
        continue;
    }
    updated++;
    console.log(`${name}:`);
    for (const c of result.changes) console.log(`  ${c}`);
}

console.log(`\n== summary ==`);
console.log(`root dependency changes: ${rootChanges.length}`);
console.log(`templates updated: ${updated}`);
console.log(`templates skipped (archived): ${skipped}`);
if (opts.dry) {
    console.log('\nDry run only — rerun without --dry to write changes.');
} else {
    console.log('\nNext steps: npm install && npm run compile --workspaces --if-present && npm test');
}
