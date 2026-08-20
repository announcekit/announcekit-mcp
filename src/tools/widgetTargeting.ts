/**
 * Helpers for reading and writing a post's audience targeting.
 *
 * A post can be limited to specific widgets. There is no `widget_id` field on a
 * post; targeting is expressed as a segmentation rule over the reserved
 * `$widget` attribute, which carries the id of the widget a visitor is viewing.
 * So "only show this post in widget 12" is the rule ["equal", "$widget", "12"].
 *
 * A post with no targeting appears in every widget of the project.
 *
 * The API carries these rules in a `segment_filters` field with three quirks,
 * all contained in this module so the tools never deal with them:
 *   - the scalar is a JSON *string*, not a JSON value;
 *   - the top level must be an object wrapping the expression under `filter`,
 *     i.e. {"filter": ["equal", "$widget", "12"]} — a bare expression is
 *     rejected by the API;
 *   - an unset value can come back as the literal string "null".
 */

/** Reserved segmentation attribute holding the viewer's widget id. */
const WIDGET_FIELD = "$widget";

/** Serialized form of "this post has no targeting at all". */
export const NO_TARGETING = "null";

/** Turn a list of widget ids into a segmentation rule. Empty list = no targeting. */
export function buildWidgetFilter(widgetIds: readonly string[]): unknown {
  const ids = widgetIds.map((id) => String(id).trim()).filter((id) => id !== "");
  if (ids.length === 0) return null;
  const rules = ids.map((id) => ["equal", WIDGET_FIELD, id]);
  return rules.length === 1 ? rules[0] : ["or", ...rules];
}

/**
 * Serialize an expression for the API: wrapped under `filter`, then stringified.
 * A null expression serializes to "null", which clears the post's targeting.
 */
export function serializeFilter(filter: unknown): string {
  return JSON.stringify(filter == null ? null : { filter });
}

/**
 * Parse what the API returned and return the bare expression. Tolerates null,
 * the string "null", an already-parsed value, and — defensively — a value that
 * is not wrapped under `filter`.
 */
export function parseFilter(raw: unknown): unknown {
  let value: unknown = raw;

  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (value == null) return null;

  if (!Array.isArray(value) && typeof value === "object" && "filter" in (value as Record<string, unknown>)) {
    return (value as { filter?: unknown }).filter ?? null;
  }
  return value;
}

function isExpression(node: unknown): node is unknown[] {
  return Array.isArray(node) && typeof node[0] === "string";
}

/**
 * Walk a rule and report what it targets: the widget ids it names, and whether
 * it also carries rules on anything else (country, custom attributes, ...) that
 * the widget_ids shorthand cannot express.
 */
export function inspectFilter(filter: unknown): { widget_ids: string[]; has_other_rules: boolean } {
  const widgetIds: string[] = [];
  let hasOther = false;

  const walk = (node: unknown): void => {
    if (!isExpression(node)) return;
    const [op, ...rest] = node as [string, ...unknown[]];

    if (op === "and" || op === "or") {
      rest.forEach(walk);
      return;
    }
    if (op === "equal" && rest[0] === WIDGET_FIELD && typeof rest[1] === "string") {
      widgetIds.push(rest[1]);
      return;
    }
    hasOther = true;
  };

  walk(filter);
  return { widget_ids: widgetIds, has_other_rules: hasOther };
}

/**
 * Read-side summary of a post's targeting, with widget names resolved so the
 * answer is readable without a second lookup.
 */
export function summarizeTargeting(rawFilter: unknown, widgets: Array<{ id: string; name: string }>) {
  const filter = parseFilter(rawFilter);
  if (filter === null) {
    return { widgets: [], has_other_rules: false, summary: "Not targeted — appears in every widget." };
  }

  const { widget_ids, has_other_rules } = inspectFilter(filter);
  const named = widget_ids.map((id) => ({ id, name: widgets.find((w) => String(w.id) === id)?.name ?? null }));

  const parts: string[] = [];
  if (named.length > 0) parts.push(`Limited to widget(s): ${named.map((w) => w.name ?? w.id).join(", ")}.`);
  if (has_other_rules) parts.push("Also carries audience rules beyond widgets — edit those in the AnnounceKit dashboard.");
  if (parts.length === 0) parts.push("Targeted, but by rules this tool cannot summarize.");

  return { widgets: named, has_other_rules, segment_filters: filter, summary: parts.join(" ") };
}

/**
 * Resolve the `segment_filters` value to send for a write, or undefined to leave
 * the post's current targeting untouched. `segment_filters` wins over
 * `widget_ids` when both are given.
 */
export function resolveTargetingInput(args: { widget_ids?: string[]; segment_filters?: string }): string | undefined {
  if (args.segment_filters !== undefined) return args.segment_filters;
  if (args.widget_ids !== undefined) return serializeFilter(buildWidgetFilter(args.widget_ids));
  return undefined;
}
