export function isWorkspaceAdmin(
  role: string | null | undefined
): boolean {
  return role === "owner" || role === "admin";
}

export function isOwner(role: string | null | undefined): boolean {
  return role === "owner";
}
