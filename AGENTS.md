<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- AI logic (itinerary agent, A*, Bayesian inference) lives as pure functions in `src/lib/astana/`, with tests in `astana.test.ts`; routes only render it. Why: keeps the algorithms testable and independent of UI.
- The itinerary agent ranks feasible stops by interest/category relevance and normalized popularity per visit-plus-travel hour; displayed limits belong to the generated preference snapshot. Why: favors relevant time-efficient stops and prevents edited controls from mislabeling an existing plan.
- Maps use Leaflet + OpenStreetMap tiles, loaded only in the browser via `src/components/map/MapView.tsx` (lazy + ClientOnly). Why: Leaflet touches `window` at import and breaks SSR; no API key is needed.
- The A* schematic and geographic map share trace-derived markers and lines; schematic positions never determine route costs. Why: both views stay synchronized without changing the search graph.
- Bayesian charts, attraction scores and map markers render the same inference output; setting determines suitability and category summaries are averages. Why: keeps every probability view consistent without inventing attraction-specific evidence.
- Landmarks are read from the Lovable Cloud `landmarks` table via `listLandmarks` (public server fn), falling back to the bundled copy in `landmarks.ts`; the A* road graph stays static. Why: one source of truth, while the app still works if the backend is down.
- Visitor preferences are saved per browser without sign-in: a random token in localStorage, read/written only through security-definer RPCs (`get_/save_tourist_preferences`); the table itself has no client grants. Why: user chose no accounts; the token acts as the secret.
