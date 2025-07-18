// src/components/AuthListener.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthListener() {
  const router = useRouter();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          router.push("/auth");
        }
        if (event === "SIGNED_IN" && session?.user) {
          // Redirect to personal path, e.g., /user/{id}
          const userId = session.user.id;
          router.push(`/user/${userId}`);
        }
      }
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
