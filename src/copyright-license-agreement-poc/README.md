# Copyright License (agreement@1.0.0 migration prototype)

A prototype of [`copyright-license`](../copyright-license) migrated onto the
model design proposed in
[accordproject/models#200](https://github.com/accordproject/models/pull/200)
("Agreement 1.0 Model Redesign"). This template exists to show what
migrating a template with a nested payment clause actually looks like at the
model, sample-data, and logic level, and to pin down precisely where today's
tooling (`cicero-core` / `@accordproject/template-engine`) still falls short
of loading, rendering, and triggering it end to end.

## The current design

Per PR #200's current shape:

- **No `@template` decorator.** A template's model declares exactly one
  *concrete* subtype of `templatedata@1.0.0.TemplateData`, and that subtype
  IS the template model — the renderable root is found by its parent type,
  not a decorator. `model/model.cto`'s `CopyrightLicenseData` is that root;
  it carries the template's variables directly, so the grammar
  (`text/grammar.tem.md`) roots at the data itself: `{{effectiveDate}}`
  resolves directly, with no `{{#with data}}` wrapper.
- **The root is the data, never an envelope.** There is no
  `TemplateModel extends AgreementDocument {}` wrapper class — that's the
  anti-pattern the design forbids. Types the data is composed of (like
  `PaymentTerms`) are ordinary concepts and must NOT extend `TemplateData`;
  only the root does.
- **No `clauses` map.** `copyright-license` has no sub-template archive —
  its `{{#clause paymentTerms}}` block is an inline grammar block written
  directly in this template's own grammar, not a composed sub-template. So
  `PaymentTerms` is simply a nested ordinary concept, addressed as a
  subtree of the data at `"paymentTerms"`. There is no `Clauses` map, and
  no duplicated copy of the payment data for `logic.ts` to be ambiguous
  about.
- **`PartyRef`, not a relationship.** `licensee`/`licensor` are `PartyRef`
  values (`model/party.cto`) — portable embedded references — not `-->
  Party` relationships. A relationship reaches `logic.trigger()` as an
  unresolvable `"resource:...#me"` string with no registry to resolve it
  against; `PartyRef` needs no resolution step, so `logic.ts` no longer
  needs a hand-rolled `resolveParty()` helper. `--> Party` relationships
  remain the right tool on the agreement envelope's `AgreementParty`, where
  a registry actually exists — see `model/agreement.cto`, which documents
  that wider envelope even though this template's own model doesn't import
  it (it has no envelope to be composed onto).

See `model/*.cto` for the vendored prototype namespaces (`templatedata@0.1.0`,
`party@0.1.0`, `agreement@0.1.0` — hand-written local stand-ins for the
`templatedata@1.0.0` / `party@1.0.0` / `agreement@1.0.0` namespaces proposed
in PR #200, since that PR is unpublished) and their inline comments for the
reasoning behind each shape.

## Known gap: this cannot load with today's installed toolchain

Rooting the grammar at the data (rather than at an empty subclass of a
shared envelope) fixes the *specific* rendering problem the previous
revision of this prototype hit. But there is a second, more fundamental
problem: the *installed* `@accordproject/cicero-core` (2.1.1, including the
copy vendored inside `@accordproject/template-engine`) finds a template's
root concept exclusively via the `@template` decorator —
`Template#getTemplateModel()` calls markdown-template's
`findTemplateConcept()`, which throws `"Failed to find a concept with the
@template decorator"` when none is present. That call isn't confined to
drafting: `Template#validate()` calls it unconditionally, and
`Template.fromDirectory()` calls `validate()` — so with no `@template`
decorator, **this template cannot even be loaded** by the installed
toolchain, let alone drafted or triggered.

Confirmed empirically:

```
$ node -e "require('@accordproject/cicero-core').Template
  .fromDirectory('src/copyright-license-agreement-poc', { offline: true })
  .then(() => console.log('LOADED OK'))
  .catch(e => console.log('ERROR:', e.message));"
ERROR: Failed to find a concept with the @template decorator. The model for
the template must contain a single concept with the @template decoratpr.
```

The fix — finding the template model by parent type
(`templatedata@1.0.0.TemplateData`) instead of, or in addition to, a
decorator — is the subject of
[accordproject/template-archive#946](https://github.com/accordproject/template-archive/issues/946),
which is not released. Until it ships, this prototype cannot compile *and*
load through cicero-core: `npm run compile` (raw Concerto model
compilation) succeeds, and `logic/logic.test.ts` (which drives
`logic.ts` directly, without cicero-core) passes, but
`test/render.test.mjs`'s `template-engine render` and `template-engine
trigger` checks are both tracked as expected failures — see that file's
`expectedLoadFailures` — with a comment naming template-archive#946.
`@template` has deliberately **not** been added back: doing so would
silently paper over the exact gap this prototype exists to surface.
