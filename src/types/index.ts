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
/** Optional modules a gym switches on (closed list in the API). */
export type GymFeature = "sales" | "body_tracking" | "kiosk";
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
  features: GymFeature[];
}

/** A sellable membership plan with its suggested prices (`GET /membership-plans`). */
export interface MembershipPlan {
  id: Uuid;
  name: string;
  description: string | null;
  is_active: boolean;
  position: number;
  prices: MembershipPrice[];
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
  gym: {
    id: Uuid;
    name: string;
    brand_color: string;
    logo_url: string | null;
    features: GymFeature[];
  };
  branches: Branch[];
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
  plan_names: string[];
  starts_on: DateString;
  ends_on: DateString;
  last_receipt: string | null;
}

export interface MembershipView {
  id: Uuid;
  plan_id: Uuid;
  plan_name: string;
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
  plan_id?: Uuid;
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
  plan_id?: Uuid;
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

/** Error as the UI sees it: stable `code`, Spanish `message`. Mock and real adapters throw this shape. */
export interface ApiError {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}

/** `PATCH /members/{id}/memberships/{membership_id}`: send only what changed (the end date is computed by the server). */
export interface PeriodChanges {
  months?: number;
  starts_on?: DateString;
  amount?: Money;
  method?: PaymentMethod;
}

// ---- Sales module (`sales`) ----

export interface Product {
  id: Uuid;
  name: string;
  price: Money;
  is_active: boolean;
  position: number;
}

export type ProductSaleStatus = "paid" | "pending";

export interface ProductSale {
  id: Uuid;
  branch: Named;
  status: ProductSaleStatus;
  was_pending: boolean;
  method: PaymentMethod | null;
  total: Money;
  units: number;
  sold_at: Timestamp;
  sold_on: DateString;
  sold_by: { id: Uuid; full_name: string };
  member: { id: Uuid; full_name: string; document_number: string } | null;
  collection_id: Uuid | null;
  collected_at: Timestamp | null;
  items: {
    product_id: Uuid;
    name: string;
    quantity: number;
    unit_price: Money;
    line_total: Money;
  }[];
}

/** Prices are never sent: the server uses the catalog price. */
export interface NewProductSale {
  id?: Uuid;
  branch_id: Uuid;
  member_id?: Uuid;
  status?: ProductSaleStatus;
  method?: PaymentMethod;
  items: { product_id: Uuid; quantity: number }[];
}

export interface MemberPending {
  member_id: Uuid;
  balance: Money;
  pending_count: number;
  sales: ProductSale[];
}

export interface NewCollection {
  id?: Uuid;
  member_id: Uuid;
  branch_id: Uuid;
  method: PaymentMethod;
  sale_ids?: Uuid[];
}

export interface Collection {
  id: Uuid;
  amount: Money;
  remaining_balance: Money;
  method: PaymentMethod;
  sale_ids: Uuid[];
}

// ---- Body tracking (`body_tracking`): sensitive data, never persisted or logged ----

export interface BodyMeasurement {
  id: Uuid;
  member_id: Uuid;
  measured_on: DateString;
  weight_kg: number | null;
  notes: string;
}

export interface NewMeasurement {
  id?: Uuid;
  measured_on?: DateString;
  weight_kg?: number;
  notes?: string;
}
