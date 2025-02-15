import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AuthError, AuthUser } from "@supabase/supabase-js";
import { UserService } from "@/api/services/UserService";
import { User } from "@/types/index";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: AuthError | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userService = new UserService();

  const handleInvalidUser = async () => {
    console.log("Handling invalid user - clearing all state");
    setLoading(true);
    queryClient.clear();
    localStorage.clear();
    indexedDB.deleteDatabase("supabase-auth-token");
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    let mounted = true;
    console.log("Auth effect running");

    const checkSession = async () => {
      console.log("Checking session...");
      try {
        const user = await userService.getCurrentUser();

        if (!mounted) return;

        if (!user) {
          console.log("No user found");
          await handleInvalidUser();
          return;
        }

        console.log("Valid user found, setting state");
        setUser(user);
        setLoading(false);
      } catch (error) {
        console.error("Session check error:", error);
        if (mounted) {
          await handleInvalidUser();
        }
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);

      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
        return;
      }

      if (session?.user) {
        try {
          const user = await userService.getCurrentUser();

          if (!mounted) return;

          if (!user) {
            console.log("No user found after auth state change");
            await handleInvalidUser();
            return;
          }

          setUser(user);
        } catch (error) {
          console.error("Error checking user:", error);
          if (mounted) {
            await handleInvalidUser();
          }
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, queryClient]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      setUser(data.user);

      if (!hasOrg) {
        navigate("/post-signup");
      } else {
        navigate("/");
      }
    } catch (error) {
      setError(error as AuthError);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;

      setUser(data?.user ?? null);
      navigate("/post-signup");
    } catch (error) {
      setError(error as AuthError);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      navigate("/login");
    } catch (error) {
      setError(error as AuthError);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGithub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setError(error as AuthError);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        signInWithGithub,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
