# Copyright License (agreement@1.0.0 migration prototype)

A prototype of [`copyright-license`](../copyright-license) migrated onto the
model design proposed in
[accordproject/models#200](https://github.com/accordproject/models/pull/200)
("Agreement 1.0 Model Redesign"), which that PR itself calls "a design
target, not migration-ready." This template exists to show what migrating a
template with a nested payment clause actually looks like at the model,
sample-data, and logic level, and to pin down precisely where today's
tooling (`cicero-core` / `@accordproject/markdown-template`) still falls
short of rendering it end to end.

See `model/*.cto` for the vendored prototype namespaces (`party@0.1.0`,
`agreement@0.1.0`) and inline comments explaining each design decision and
the known rendering gap. `npm run test:render` compiles this template and
round-trips `sample.json` successfully, and its `trigger()` logic runs; its
natural-language rendering is expected to fail (see `test/render.test.mjs`'s
`expectedFailures`) until the template engine can bind a `{{#clause}}` /
`{{#with}}` block to a polymorphic, composed field.
