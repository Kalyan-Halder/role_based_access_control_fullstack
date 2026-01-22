import { AuthContext } from "../context/AuthContext";
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { auth, ready } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    // ✅ only redirect after we've checked localStorage
    if (ready && !auth) router.replace("/login");
  }, [ready, auth, router]);

  if (!ready) return <div className="p-6">Checking login...</div>;
  if (!auth) return <div className="p-6">Checking login...</div>;

  return <>{children}</>;
}
