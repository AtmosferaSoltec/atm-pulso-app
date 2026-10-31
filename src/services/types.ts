import type {
  MemberDetail,
  MemberList,
  MemberListQuery,
  MembershipView,
  Named,
  PaymentMethod,
  User,
} from "@/types";
export type Scenario = "single" | "branches" | "gyms";
export type PreviewState = "ready" | "empty" | "error";
/** Presentation enrichment: receipt data is absent from API MembershipView. */
export interface Subscription extends MembershipView {
  method: PaymentMethod;
  collection_branch: Named;
}
export interface MemberProfile extends Omit<MemberDetail, "memberships"> {
  memberships: Subscription[];
}
export interface SessionSnapshot {
  user: User;
  availableGyms: User["gym"][];
  gymBranchCount: number;
}
export interface SessionService {
  preview(scenario: Scenario, gymId?: string): Promise<SessionSnapshot>;
}
export interface MembersService {
  list(
    gymId: string,
    branchId: string,
    scenario: Scenario,
    query: MemberListQuery,
    state: PreviewState,
  ): Promise<MemberList>;
  get(gymId: string, id: string, scenario: Scenario): Promise<MemberProfile>;
}
export interface Services {
  session: SessionService;
  members: MembersService;
}
