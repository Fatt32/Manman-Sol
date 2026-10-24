import type { PublicUser, Sol } from './types'

/** Admin, the sol's chef, or a member holding at least one hand. */
export function canSeeSol(user: PublicUser, sol: Sol): boolean {
  return user.role === 'admin' || sol.chefId === user.id || sol.manm.some(m => m.userId === user.id)
}

/** Admin or the sol's chef. */
export function canManageSol(user: PublicUser, sol: Sol): boolean {
  return user.role === 'admin' || sol.chefId === user.id
}
