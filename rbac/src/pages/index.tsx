import RequireAuth from "@/components/RequireAuth";
import Nav from "@/components/Nav";
import { useContext, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function Dashboard() {
  const { auth } = useContext(AuthContext);
  const isAdmin = auth?.user.role === "ADMIN";

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"STAFF" | "MANAGER" | "ADMIN">("STAFF");
  const [inviteUrl, setInviteUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function createInvite() {
    setMsg("");
    setErr("");
    setInviteUrl("");

    if (!email) {
      setErr("Email is required");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch("/auth/invite", {
        method: "POST",
        body: JSON.stringify({ email, role }),
      });

      setInviteUrl(data.inviteUrl || "");
      setMsg("Invite created and email sent");
      setEmail("");
      setRole("STAFF");
    } catch (e: any) {
      setErr(e.message || "Failed to invite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <RequireAuth>
      <Nav />
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-300 mt-2">Welcome back, <span className="font-medium text-white">{auth?.user.name}</span></p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-1 rounded-full ${
              auth?.user.role === "ADMIN" 
                ? "bg-purple-100 text-purple-800" 
                : auth?.user.role === "MANAGER" 
                ? "bg-blue-100 text-blue-800" 
                : "bg-gray-100 text-gray-800"
            }`}>Status : { auth?.user.role}
            </span>
            
          </div>
          <span className="text-xs text-white">{auth?.user.email}</span>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <Link 
              className="flex-1 bg-white border border-gray-300 hover:border-gray-400 rounded-xl p-5 text-center hover:shadow-sm transition-all"
              href="/projects"
            >
              <div className="font-medium text-gray-900">Projects</div>
              <div className="text-sm text-gray-500 mt-1">Manage your projects</div>
            </Link>
            {isAdmin ? (
              <Link 
                className="flex-1 bg-white border border-gray-300 hover:border-gray-400 rounded-xl p-5 text-center hover:shadow-sm transition-all"
                href="/users"
              >
                <div className="font-medium text-gray-900">User Management</div>
                <div className="text-sm text-gray-500 mt-1">Admin panel for users</div>
              </Link>
            ) : null}
          </div>
        </div>

        {isAdmin ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Invite a New User</h2>

            <div className="space-y-5 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User Email</label>
                <input
                  className="w-full text-black px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Role</label>
                <select
                  className="w-full text-black px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  <option value="STAFF">STAFF</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <button
                className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3.5 px-4 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-70"
                onClick={createInvite}
                disabled={loading || !email}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Invite...
                  </span>
                ) : (
                  "Send Invite"
                )}
              </button>

              {err ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-600 text-sm mt-1">{err}</p>
                </div>
              ) : null}
              
              {msg ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">Success</p>
                  <p className="text-green-600 text-sm mt-1">{msg}</p>
                </div>
              ) : null}

              {inviteUrl ? (
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="font-medium text-gray-900 mb-2">Invite Link (Backup)</div>
                  <div className="font-mono text-sm break-all bg-white p-3 rounded-lg border border-gray-300 mb-3">
                    {inviteUrl}
                  </div>
                  <div className="text-xs text-gray-500">
                    Copy this link to share with the user directly if needed.
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </RequireAuth>
  );
}