import type { APIRoute } from "astro";
import { addStroke, countStrokes, MAX_D_LENGTH, MAX_WIDTH, MIN_WIDTH, toPublic } from "../../lib/db";
import { localBounds, zoneStart } from "../../lib/layout";
import { publish } from "../../lib/live";
import { parsePath, pathPoints, shiftPath } from "../../lib/path";
import { log } from "../../lib/visitor";

// The only write path into the scroll. Validated here, not just trusted
// from the client — see CLAUDE.md's rule that the data layer is the one
// place these promises actually hold. The mark belongs to whoever the
// cookie says sent it, never to anything in the body.
export const POST: APIRoute = async ({ request, locals }) => {
  const { visitor } = locals;
  const refuse = (reason: string, message: string): Response => {
    log("refused", { visitor: visitor.label, reason });
    return new Response(message, { status: 400 });
  };

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return refuse("not-json", "expected a JSON body");
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).d !== "string" ||
    typeof (body as Record<string, unknown>).width !== "number"
  ) {
    return refuse("shape", 'expected { "d": string, "width": number }');
  }

  const { d, width } = body as { d: string; width: number };

  if (d.length === 0 || d.length > MAX_D_LENGTH) {
    return refuse("length", "stroke path is empty or too long");
  }
  if (!Number.isFinite(width) || width < MIN_WIDTH || width > MAX_WIDTH) {
    return refuse("width", "stroke width out of range");
  }

  const segments = parsePath(d);
  if (segments === null) {
    return refuse("path", "stroke path must be M, then L and Q segments only");
  }

  // Coordinates are local to the strip the visitor drew in. A mark painted
  // outside it would cover someone else's: erasing by other means.
  const { minX, maxX, minY, maxY } = localBounds(width);
  if (
    !pathPoints(segments).every((p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY)
  ) {
    return refuse("outside-strip", "stroke reaches outside its strip");
  }

  // Placed in whichever strip is blank now, not the one the visitor saw:
  // two people drawing at once both keep their mark, in arrival order
  // (decisions/0001-two-marks-at-once.md). Nothing awaits between the count
  // and the insert, so no other write can land in between.
  const strip = countStrokes();
  const placedAt = zoneStart(strip);
  const stroke = addStroke(shiftPath(segments, placedAt), width, visitor.hash);
  publish(stroke);
  log("mark", { visitor: visitor.label, id: stroke.id, strip });
  return new Response(JSON.stringify({ ...toPublic(stroke, visitor.hash), placedAt }), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
};
