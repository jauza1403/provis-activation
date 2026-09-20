# Preserve the dark login field treatment during autofill

Written against: 5423ff9

## Evidence chain

- Surface: `/login`, rendered mobile login state with browser-populated username and password fields
- Problem: Browser autofill renders both fields with a bright opaque light background, while the surrounding login card and labels use the portal's dark visual system.
- Design evidence: `app/globals.css` defines the portal surface as `#080b10` / `#0d1117` and the final `select,input,textarea` rule as `#0a0e14` with light text; the login fields are explicitly part of that surface via `.login-field-input`.
- Owner: `app/globals.css` (`.login-field-input` and form-control theme rules)
- Scope and affected surfaces: `/login` username and password inputs; no dashboard form controls should change.
- Uncertainty: none

## Design decision

Keep browser-autofilled login fields on the same dark background, border, and text colors as manually entered fields so autofill does not create a contradictory light control treatment.

## Reuse

- Existing `.login-field-input` class and the final dark form-control values in `app/globals.css`
- Exemplar: `app/globals.css:744-751`

## Changes

1. `app/globals.css`
   - Change: Add a scoped `:-webkit-autofill` rule for `.login-field-input` that uses the existing dark field color through an inset box shadow, preserves the existing text color, and keeps the transition behavior stable.
   - Preserve: Native username/password autocomplete semantics and the existing focus treatment.
   - Verify: Populated or autofilled username and password fields remain dark and visually match the login card in Chromium at narrow and wide viewports.

## Scope

- Inherit: Only login fields carrying `.login-field-input`.
- Verify: `/login` with empty fields, typed values, and browser-populated values.
- Exclude: Dashboard inputs, authentication behavior, labels, copy, and the existing iForte visual identity.

## Validation

- Product: Open `/login`; confirm both credentials fields remain readable and consistent when populated.
- Interface: Check the captured narrow viewport and a desktop viewport; inspect focus and error states.
- System: Confirm no unscoped `input` styling or new parallel field primitive is introduced.
- Repository: `npm run lint` → no lint errors.

## Stop conditions

- Stop if the browser does not expose the autofill state or if the existing dark form-control owner changes.

## Design documentation

- After acceptance and validation: none; this is a correction to the existing login field treatment.
