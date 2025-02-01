import { supabase } from "./supabase";
import type { AuthUser } from "../types/auth";

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export function subscribeToAuthChanges(
  callback: (user: AuthUser | null) => void
) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}

export interface PendingInvite {
  id: string;
  organization_id: string;
  organization_name: string; // We'll join with organizations table
  role: "owner" | "admin" | "member";
  token: string;
  created_at: string;
}

// Check for pending invites for a user's email
export async function getPendingInvites(
  email: string
): Promise<PendingInvite[]> {
  const { data, error } = await supabase
    .from("organization_invites")
    .select(
      `
      id,
      organization_id,
      organizations (
        name
      ),
      role,
      token,
      created_at
    `
    )
    .eq("email", email)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString());

  if (error) throw error;
  return data.map((invite) => ({
    ...invite,
    organization_name: invite.organizations.name,
  }));
}

// Accept an invite
export async function acceptInvite(
  token: string
): Promise<{ organizationId: string }> {
  const { data, error } = await supabase.rpc("accept_organization_invite", {
    invite_token: token,
  });

  if (error) throw error;
  return { organizationId: data };
}

// Create a new organization
export async function createOrganization(
  name: string
): Promise<{ organizationId: string }> {
  const { data, error } = await supabase.rpc("create_organization", {
    org_name: name,
  });

  if (error) throw error;
  return { organizationId: data };
}
