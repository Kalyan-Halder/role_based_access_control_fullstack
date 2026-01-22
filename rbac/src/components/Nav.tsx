import Link from "next/link";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Nav() {
  const { auth, logout } = useContext(AuthContext);

  return (
    <div className="border-b">
      <div className="max-w-5xl mx-auto p-4 flex items-center justify-between">
        <div className="flex gap-4">
          <Link href="/" className="font-semibold">Dashboard</Link>
          <Link href="/projects">Projects</Link>
          {auth?.user.role === "ADMIN" ? <Link href="/users">Users</Link> : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-300">
            <div>{auth?.user.email}</div>
             <div>Status : {auth?.user.role}</div>
            
          </div>
          <button
            onClick={logout}
            className="px-3 py-1 border rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
