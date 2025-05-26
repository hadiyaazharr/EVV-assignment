export const ROLES = {
  ADMIN: 'ADMIN',
  CAREGIVER: 'CAREGIVER',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES]; 