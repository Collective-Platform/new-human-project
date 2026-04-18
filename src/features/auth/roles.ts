import type { SessionUser } from "./session";

export type UserRole = "user" | "admin" | "su";
export type UserStatus = "guest" | "active" | "suspended" | "deleted";

export function hasRole(user: SessionUser, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    user: 0,
    admin: 1,
    su: 2,
  };
  return (
    (roleHierarchy[user.role as UserRole] ?? -1) >=
    roleHierarchy[requiredRole]
  );
}

export function isAdmin(user: SessionUser): boolean {
  return hasRole(user, "admin");
}

export function isSuperUser(user: SessionUser): boolean {
  return hasRole(user, "su");
}

export function isActive(user: SessionUser): boolean {
  return user.status === "active";
}
