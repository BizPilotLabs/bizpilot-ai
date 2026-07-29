# Shared Accessibility Guidelines

BizPilot AI uses custom React UI primitives backed by native HTML semantics. Shared primitives should carry accessibility requirements so feature modules do not need to patch dialogs, controls, and forms independently.

## Dialogs and Drawers

- Every modal dialog and drawer must have a visible `title`.
- The shared `Modal` and `Drawer` components generate unique IDs and wire the visible title through `aria-labelledby`.
- Meaningful descriptions are wired with `aria-describedby`; empty or omitted descriptions do not create invalid references.
- The close button must have a meaningful label. Use the default labels unless the context needs a more specific one.
- Initial focus moves to a safe control, normally the close button, not a destructive action.
- When the dialog closes, focus returns to the element that opened it when available.
- Destructive confirmations should keep the cancel action visually available and should not autofocus the destructive action.

## Dropdowns and Menus

- Icon-only triggers must provide an accessible name such as `Comment actions`, `User actions`, or `Role actions`.
- Menu items should use descriptive visible text and must remain reachable by keyboard.
- Do not rely on a tooltip as the only accessible name.

## Forms and Errors

- Prefer shared `Input`, `Textarea`, and `Select` primitives for new forms.
- Validation errors should be passed through the shared component `error` prop where available.
- Invalid controls expose `aria-invalid="true"` and reference the error text with `aria-describedby`.
- Help text and error text should not share the same ID at the same time.

## Icon Buttons

Icon-only buttons must include a useful `aria-label`. Common examples:

- `Close modal`
- `Close drawer`
- `Comment actions`
- `Previous page`
- `Next page`
- `Retry`
- `Delete comment`

## Pagination

Pagination uses a `nav` landmark with `aria-label="Pagination"`. Page buttons should expose destination names such as `Go to page 2`; the current page should expose `aria-current="page"`.

## Testing Conventions

- Query dialogs by role and accessible name: `getByRole("dialog", { name: "Delete Comment" })`.
- Query icon-only controls by their accessible labels.
- Prefer user-observable assertions over component internals.
- Automated checks in this repository are focused unit and integration tests, not WCAG certification.

## Comment Route Coverage

Comment route integration tests exercise the real Express route stack with mocked auth, RBAC, and repository boundaries. They cover authentication, permission denial, request validation, route-to-service mapping, organization/user context propagation, and safe error responses for task scoping failures.
