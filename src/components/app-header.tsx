import {
  Github,
  Wand2,
  User as UserIcon,
  LogOut,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function AppHeader() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-accent/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-accent" />
          <span className="font-bold text-foreground">TypeWise AI</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <div className="relative group">
              <Button
                variant="outline"
                className="flex items-center gap-2 font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg px-3"
              >
                <UserIcon className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="hidden sm:inline max-w-[100px] truncate text-sm">
                  {user.email}
                </span>
                <ChevronDown className="w-4 h-4 ml-1 text-muted-foreground" />
              </Button>
              <div className="absolute right-0 mt-2 w-48 bg-background border border-accent/20 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
                <div className="flex flex-col py-2">
                  <Link
                    href={`/user/${user.id}/profile`}
                    className="px-4 py-2 text-sm text-foreground hover:bg-accent/10 transition rounded-md text-left"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 text-sm text-destructive flex items-center gap-2 hover:bg-destructive/10 transition rounded-md text-left"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link href="/auth">
              <Button size="sm" className="font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg">
                Sign In
              </Button>
            </Link>
          )}
          <a
            href="https://github.com/Bhavishya011/TypeWise-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-foreground transition-colors hover:text-accent"
          >
            <Github className="h-5 w-5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}
