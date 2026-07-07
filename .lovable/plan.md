## Goal

Update the three legal pages so it's explicit that SmartyMove is part of the **Smarty Wellness** family of brands (alongside SmartyGym and SmartyDiet), matching the wording from smartywellness.com.

## Reference wording (from smartywellness.com)

> Smarty Wellness is the mother company of a growing family of brands — a complete, science-based ecosystem for everyday human wellness. It includes SmartyGym (train), SmartyMove (assess) and SmartyDiet (fuel).

## Changes

### 1. `src/components/LegalLayout.tsx`
Update the top info strip:
- **Operator:** SmartyMove (smartymove.com), part of the **Smarty Wellness** family of brands (with SmartyGym and SmartyDiet).
- Keep contact email and Last updated as-is.

### 2. `src/routes/privacy.tsx`
- Intro paragraph: state SmartyMove is operated as part of the Smarty Wellness family (SmartyGym, SmartyMove, SmartyDiet).
- Section 12 (Contact) / Data Controller: add "SmartyMove, part of Smarty Wellness (smartywellness.com)" plus links to the sibling brands.
- Bump `lastUpdated` to "July 2026".

### 3. `src/routes/terms.tsx`
- Intro paragraph: add Smarty Wellness family attribution.
- Section 3 ("What SmartyMove Is"): expand the sister-product mention to reference the full family — SmartyGym (train), SmartyMove (assess), SmartyDiet (fuel) — all under Smarty Wellness, each with separate accounts.
- Section 12 (Intellectual Property): note IP is held by SmartyMove / Smarty Wellness.
- Section 17 (Contact): add Smarty Wellness reference.
- Bump `lastUpdated` to "July 2026".

### 4. `src/routes/disclaimer.tsx`
- Intro paragraph: add Smarty Wellness family attribution.
- Section 6 (Release of Liability): extend the released parties to include Smarty Wellness and its affiliated brands (SmartyGym, SmartyDiet).
- Bump `lastUpdated` to "July 2026".

## Out of scope
- No new route, no footer/nav changes, no logo updates.
- No changes to onboarding disclaimer copy (`src/routes/onboarding/disclaimer.tsx`) unless you want it too — say the word and I'll include it.

## Verification
Run `bunx tsgo --noEmit` after edits.
