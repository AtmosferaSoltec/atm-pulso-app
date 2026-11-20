import type {
  BodyMeasurement,
  Collection,
  EnrollMember,
  MemberDetail,
  MemberList,
  MemberListQuery,
  MemberPending,
  MembershipPlan,
  NewCollection,
  NewMeasurement,
  NewProductSale,
  PeriodChanges,
  Product,
  ProductCategory,
  ProductSale,
  RenewMember,
  Sale,
  User,
} from "@/types";

/** Screens only know these interfaces; `mock/` and `real/` implement them. */

/** A gym (auth company) the person can work in. Shown only when there is more than one. */
export interface GymOption {
  id: string;
  name: string;
  current: boolean;
}

export interface SessionSnapshot {
  user: User;
  gyms: GymOption[];
  /** Active plans of the current gym, in the order they are offered. */
  plans: MembershipPlan[];
}

export interface AuthService {
  /** True when a stored session exists (it is verified by `session.load`). */
  restore(): Promise<boolean>;
  /** Throws `PASSWORD_CHANGE_REQUIRED` when the first password must be replaced. */
  /** `documentNumber` is the number of a DNI, a CE or a passport. */
  signIn(documentNumber: string, password: string): Promise<void>;
  changePassword(
    documentNumber: string,
    current: string,
    next: string,
  ): Promise<void>;
  signOut(): Promise<void>;
  /** Called when the session can no longer be renewed (refresh failed). Returns the unsubscribe function. */
  onExpired(listener: () => void): () => void;
}

export interface SessionService {
  load(): Promise<SessionSnapshot>;
  /** Moves the session to another gym of the same person. Call `load` afterwards. */
  switchGym(id: string): Promise<void>;
}

export interface MembersService {
  list(query: MemberListQuery): Promise<MemberList>;
  get(id: string): Promise<MemberDetail>;
  /** Name of a DNI (RENIEC via the API), to pre-fill a new member. `null` when unknown or the lookup is down. */
  lookupDni(dni: string): Promise<string | null>;
  enroll(input: EnrollMember): Promise<Sale>;
  renew(memberId: string, input: RenewMember): Promise<Sale>;
  /** Corrects a period that has not ended (`PATCH /members/{id}/memberships/{membership_id}`). */
  updatePeriod(
    memberId: string,
    periodId: string,
    changes: PeriodChanges,
  ): Promise<Sale>;
}

/** Module `sales`. Every call answers `FEATURE_DISABLED` when the gym does not have it. */
export interface SalesService {
  /** Active products, in catalog order. */
  products(): Promise<Product[]>;
  /** The gym's product categories, in order. Empty when it has none. */
  categories(): Promise<ProductCategory[]>;
  /** Paid now, or left pending for a member (`status: "pending"`). Idempotent by `id`. */
  sell(input: NewProductSale): Promise<ProductSale>;
  pending(memberId: string): Promise<MemberPending>;
  /** Whole pending sales only: all of them or none. Idempotent by `id`. */
  collect(input: NewCollection): Promise<Collection>;
}

/** What a proof of payment belongs to: a membership payment, a sale paid on the spot, or a collection. */
export interface ProofOwner {
  kind: "receipt" | "sale" | "collection";
  id: string;
}

/** A photo (JPEG) or PDF already on the device. */
export interface ProofFile {
  uri: string;
  mimeType: string;
}

/** Optional proofs of payment (never for cash). Up to 5 per owner; uploaded files cannot be changed. */
export interface VouchersService {
  upload(owner: ProofOwner, file: ProofFile): Promise<void>;
}

/** Module `body_tracking`. Sensitive data: reads are audited by the server, so call only on demand. */
export interface BodyService {
  /** Newest first. Never call from lists or in the background. */
  measurements(memberId: string): Promise<BodyMeasurement[]>;
  record(memberId: string, input: NewMeasurement): Promise<BodyMeasurement>;
}

/** Development scenarios of the mock adapter. Absent with the real adapter. */
export type Scenario = "single" | "branches" | "gyms";
export type PreviewState = "ready" | "empty" | "error";
export interface MockLab {
  scenario: Scenario;
  previewState: PreviewState;
  set(next: Partial<Pick<MockLab, "scenario" | "previewState">>): void;
}

export interface Services {
  mode: "mock" | "real";
  capabilities: {
    /** The API can correct a period and the adapter implements it. */
    updatePeriod: boolean;
  };
  auth: AuthService;
  session: SessionService;
  members: MembersService;
  sales: SalesService;
  body: BodyService;
  vouchers: VouchersService;
  lab?: MockLab;
}
