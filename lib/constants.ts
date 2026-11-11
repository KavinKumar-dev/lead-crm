export const CLIENT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;
export type ClientStatus = (typeof CLIENT_STATUS)[keyof typeof CLIENT_STATUS];

export const LEAD_SOURCE = {
  INSTAGRAM: 'INSTAGRAM',
  FACEBOOK: 'FACEBOOK',
  WHATSAPP: 'WHATSAPP',
  OTHER: 'OTHER',
} as const;
export type LeadSource = (typeof LEAD_SOURCE)[keyof typeof LEAD_SOURCE];

export const LEAD_STATUS = {
  NEW_LEAD: 'NEW_LEAD',
  CONTACTED: 'CONTACTED',
  INTERESTED: 'INTERESTED',
  NOT_RESPONDING: 'NOT_RESPONDING',
  FOLLOW_UP_REQUIRED: 'FOLLOW_UP_REQUIRED',
  CONVERTED: 'CONVERTED',
  LOST: 'LOST',
} as const;
export type LeadStatus = (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS];

export const FOLLOW_UP_STAGE = {
  INITIAL_CONTACT: 'INITIAL_CONTACT',
  FOLLOW_UP_1: 'FOLLOW_UP_1',
  FOLLOW_UP_2: 'FOLLOW_UP_2',
  FOLLOW_UP_3: 'FOLLOW_UP_3',
} as const;
export type FollowUpStage = (typeof FOLLOW_UP_STAGE)[keyof typeof FOLLOW_UP_STAGE];

export const USER_ROLE = {
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
