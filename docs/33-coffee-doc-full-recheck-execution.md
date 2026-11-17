# 33 — Coffee Doc Full Re-check · Test · Fix

**Status:** CLOSED · 2026-11-17  
**Next step:** — (DF-01–DF-08 complete)  
**Source:** `docs/_incoming/coffee-theme-doc-1.txt` (+ doc-2)  
**Prior:** `docs/32` CT-01–08 CLOSED · `docs/31` PB CLOSED  
**Rules:** coffee UI lock · zero-mock · `store_id` isolation · no language mix · no deploy without ask

---

## 0. AI protocol

1. Do **only** the row marked `NEXT`.
2. Inspect → reuse existing coffee customizer / builder / storefront. Do **not** restyle HiBrew.
3. Test that step. Empty = hide / Waiting / No records — never fake.
4. Mark `DONE`, next `PENDING` → `NEXT`. Stop unless user asks to continue the wave.
5. Report **Ho gaya** / **Baqi**.

---

## 1. Steps

| ID | Status | Work | Done when | Test |
|----|--------|------|-----------|------|
| DF-01 | DONE | Remove home fake fallbacks: hero ORIGINAL slides, feature-icons hardcode, HONOR_EVENTS/Mixkit, catalog.slice decorate | Empty → empty/hide | `coffeeZeroMock.test.ts` |
| DF-02 | DONE | Announcements: enable + sticky + close + custom heightPx; strip respects off/dismiss | Off hides strip | Form + Header strip |
| DF-03 | DONE | Main Menu Word panel: Enable/Compare/View More; merchant desktopLinks already override mega | Merchant nav first | HeaderElementsForm + Header |
| DF-04 | DONE | Footer: empty bottomLinks = empty; linkHoverColor on hover | No invent legal links | Footer + footer controls test |
| DF-05 | DONE | Hero: no ORIGINAL fill; merchant-only images/copy (done with DF-01) | Empty → empty hero | zero-mock + HeroSlider3D |
| DF-06 | DONE | Widgets 4–11: category miss → empty; Feature Icons empty OK (DF-01 blocks) | No soft decorate | movable + zero-mock |
| DF-07 | DONE | Stubs 12–20: events CompactEmpty; compare live-or-empty; FAQ/reviews API empty; no HONOR | No fake | CoffeeBuilderBlocks |
| DF-08 | DONE | Full gate: client CT/DF + scan-ar-en-mix=0 + PHP Theme* + build | All green | Exit 0 |

---

## 2. Out of scope

Popup builder, animations library, restyling HiBrew, C-BAN return, auto-deploy, flowers/cars. Deep mega category tree / product-source pickers from merchant doc remain future (beyond this recheck wave).
