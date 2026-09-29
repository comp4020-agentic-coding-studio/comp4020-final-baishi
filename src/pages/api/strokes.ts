import type { APIRoute } from "astro";
import { addStroke, MAX_D_LENGTH, MAX_WIDTH, MIN_WIDTH } from "../../lib/db";

// The only write path into the scroll. Validated here, not just trusted
// from the client — see CLAUDE.md's rule that the data layer is the one
// place these promises actually hold.
export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("expected a JSON body", { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).d !== "string" ||
    typeof (body as Record<string, unknown>).width !== "number"
  ) {
    return new Response('expected { "d": string, "width": number }', { status: 400 });
  }

  const { d, width } = body as { d: string; width: number };

  if (d.length === 0 || d.length > MAX_D_LENGTH) {
    return new Response("stroke path is empty or too long", { status: 400 });
  }
  if (!Number.isFinite(width) || width < MIN_WIDTH || width > MAX_WIDTH) {
    return new Response("stroke width out of range", { status: 400 });
  }

  const stroke = addStroke(d, width);
  return new Response(JSON.stringify(stroke), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
};
