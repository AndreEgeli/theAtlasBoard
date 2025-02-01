export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: {
    full_name?: string;
  };
}

export interface AuthError {
  message: string;
}
