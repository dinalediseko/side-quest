export function getAuthStatus(user: any) {
  if (user === undefined) return "loading";
  if (user === null) return "logged_out";
  return "logged_in";
}