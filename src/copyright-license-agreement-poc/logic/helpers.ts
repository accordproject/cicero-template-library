// The template's helpers module, in scope in the grammar's formulas. Today
// only the fee formula in text/grammar.md uses it.
//
// formatAmount is a drafting helper: the reference drafter calls it when it
// drafts the text. The runtime logic (logic.ts) must not call it, or build
// any other string from a formatted amount or date (design: "Runtime text is
// data or drafted"); amounts leave the logic as PreciseAmount values.
//
// Formatting here is explicit and does not use Intl or toLocale*, so every
// engine drafts the same words from the same data.

import type { IPreciseAmount } from './generated/org.accordproject.money@1.0.0.js';

/**
 * An amount as digits, a decimal point at the unit's scale, and the
 * currency code: USD 100.00 (unscaledValue "10000", scale 2) is
 * "100.00 USD". No thousands separator.
 */
export function formatAmount(amount: IPreciseAmount): string {
    const { unscaledValue, unit } = amount;
    const negative = unscaledValue.startsWith('-');
    const digits = negative ? unscaledValue.slice(1) : unscaledValue;
    const scale = unit.scale;
    let number: string;
    if (scale <= 0) {
        number = digits + '0'.repeat(-scale);
    } else {
        const padded = digits.padStart(scale + 1, '0');
        number = `${padded.slice(0, -scale)}.${padded.slice(-scale)}`;
    }
    return `${negative ? '-' : ''}${number} ${unit.currencyCode}`;
}
