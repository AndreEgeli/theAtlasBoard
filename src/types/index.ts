import { Organization } from "@/types";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  active_organization_id: string | null;
  active_organization?: Organization | null;
  created_at: string;
  updated_at: string;
}
