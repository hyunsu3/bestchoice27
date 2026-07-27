export function isAuthorized(request: Request): boolean {
  const password = request.headers.get("x-app-password");
  return !!password && password === process.env.APP_EDIT_PASSWORD;
}
