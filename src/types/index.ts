/**
 * Domain types. Field names mirror atm-pulso-api/docs/openapi.yaml.
 * Money is a string ("100.00"), dates are "YYYY-MM-DD", timestamps are RFC 3339 (UTC).
 */

export type Uuid = string;
export type Money = string;
export type DateString = string;
export type Timestamp = string;

export type Role = "admin" | "receptionist";
export type DocumentType = "dni" | "ce";
export type MemberStatus = "active" | "expiring" | "expired" | "scheduled";
export type PaymentMethod = "yape_plin" | "cash" | "card" | "transfer";
export type AccessScope = "branch" | "gym";
export interface Named {
  id: Uuid;
  name: string;
}

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
}

export interface Page<T> {
  data: T[];
  meta: Pagination;
}

// ---- Session / catalog ----

export interface Branch {
  id: Uuid;
  name: string;
  address: string | null;
  gym_id: Uuid;
  gym_name: string;
}

export interface Gym {
  id: Uuid;
  name: string;
  display_name: string | null;
  tax_id: string | null;
  /** #rrggbb, lower case. Drives the brand color of the whole app. */
  brand_color: string;
  logo_url: string | null;
  day_pass_price: Money;
  day_pass_price_is_default: boolean;
  branch_sharing: boolean;
  membership_prices: MembershipPrice[];
}

export interface MembershipPrice {
  months: number;
  amount: Money;
}

export interface User {
  id: Uuid;
  document_number: string;
  full_name: string;
  phone: string | null;
  role: Role;
  organization: Named;
  gym: { id: Uuid; name: string; brand_color: string; logo_url: string | null };
  branches: Branch[];
}

export interface Catalog {
  organization: Named;
  gyms: Gym[];
}

// ---- Members ----

export interface AccessBranch {
  id: Uuid;
  label: string;
}

export interface ReceiptRef {
  id: Uuid;
  number: string;
}

export interface MemberView {
  id: Uuid;
  document_type: DocumentType;
  document_number: string;
  full_name: string;
  phone: string;
  home_branch: { id: Uuid; name: string; gym_name: string };
  status: MemberStatus;
  days_remaining: number;
  plan_label: string;
  starts_on: DateString;
  ends_on: DateString;
  last_receipt: string | null;
}

export interface MembershipView {
  id: Uuid;
  months: number;
  plan_label: string;
  starts_on: DateString;
  ends_on: DateString;
  amount: Money;
  access_scope: AccessScope;
  access_branches: AccessBranch[];
  receipt: ReceiptRef | null;
}

export interface MemberDetail extends MemberView {
  memberships: MembershipView[];
}

export interface MemberCounts {
  all: number;
  active: number;
  expiring: number;
  expired: number;
  scheduled: number;
}

export interface MemberListQuery {
  status?: MemberStatus | "all";
  search?: string;
  page?: number;
  page_size?: number;
}

export interface MemberList extends Page<MemberView> {
  counts: MemberCounts;
}

export interface EnrollMember {
  id?: Uuid;
  branch_id: Uuid;
  document_type: DocumentType;
  document_number: string;
  full_name: string;
  phone: string;
  months: number;
  starts_on?: DateString;
  amount: Money;
  method: PaymentMethod;
  access_scope?: AccessScope;
  access_branch_ids?: Uuid[];
}

export interface RenewMember {
  id?: Uuid;
  branch_id: Uuid;
  months: number;
  starts_on?: DateString;
  amount: Money;
  method: PaymentMethod;
  access_scope?: AccessScope;
  access_branch_ids?: Uuid[];
}

export interface Sale {
  member: MemberView;
  membership: MembershipView;
  receipt: ReceiptRef;
}

/** Error shape of the API: { error: { code, message, details } }. */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
