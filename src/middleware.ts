import { defineMiddleware } from "astro/middleware";
import { COOKIE, isToken, log, newToken, visitorFrom } from "./lib/visitor";

// Every request knows who it's from before any page or API route runs. A
// browser without a valid cookie is a new visitor and gets one.
export const onRequest = defineMiddleware((context, next) => {
  const existing = context.cookies.get(COOKIE)?.value;
  const known = isToken(existing);
  const token = known ? existing : newToken();
  const visitor = visitorFrom(token, !known);
  if (!known) {
    context.cookies.set(COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      // Fly's proxy terminates TLS; locally and in CI it's plain http.
      secure: context.request.headers.get("x-forwarded-proto") === "https",
    });
  }
  context.locals.visitor = visitor;

  const { pathname } = context.url;
  if (context.request.method === "GET" && !pathname.startsWith("/api/") && !pathname.includes(".")) {
    log("view", { visitor: visitor.label, new: visitor.isNew, path: pathname });
  }
  return next();
});
