import RequireAuth from "../components/RequireAuth";
import Nav from "../components/Nav";
import { apiFetch } from "../lib/api";
import { AuthContext } from "../context/AuthContext";
import { useContext, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";

type User = {
  _id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
  status: "ACTIVE" | "INACTIVE";
};

type UsersResponse = {
  items: User[];
  total: number;
  page: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export default function UsersPage() {
  const { auth } = useContext(AuthContext);
  const router = useRouter();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // basic guard
  if (auth?.user.role !== "ADMIN") {
    if (typeof window !== "undefined") router.replace("/");
    return null;
  }

  const usersQ = useQuery<UsersResponse>({
    queryKey: ["users", page, limit],
    queryFn: () => apiFetch(`/users?page=${page}&limit=${limit}`),
    staleTime: 30_000,
  });

  const roleMut = useMutation({
    mutationFn: (args: { id: string; role: User["role"] }) =>
      apiFetch(`/users/${args.id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: args.role }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const statusMut = useMutation({
    mutationFn: (args: { id: string; status: User["status"] }) =>
      apiFetch(`/users/${args.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: args.status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const totalPages = usersQ.data?.pages || 1;
  const hasNextPage = usersQ.data?.hasNext || false;
  const hasPrevPage = usersQ.data?.hasPrev || false;

  return (
    <RequireAuth>
      <Nav />
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Users (Admin)</h1>
          <div className="text-sm text-gray-500">
            {usersQ.data ? `Page ${page} of ${totalPages} • ${usersQ.data.total || 0} total users` : ""}
          </div>
        </div>

        {usersQ.isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : null}
        
        {usersQ.isError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Error loading users</p>
            <p className="text-red-600 text-sm mt-1">{(usersQ.error as any).message}</p>
          </div>
        ) : null}

        {usersQ.data ? (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-4 font-semibold p-4 bg-gray-50 border-b border-gray-200">
                <div className="text-gray-700">Name</div>
                <div className="text-gray-700">Email</div>
                <div className="text-gray-700">Role</div>
                <div className="text-gray-700">Status</div>
              </div>

              {usersQ.data.items.map((u: User) => (
                <div key={u._id} className="grid gap-4 grid-cols-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">{u.name}</div>
                  <div className="text-gray-600 text-sm">{u.email}</div>

                  <div>
                    <select
                      className="w-full px-3 py-2 text-black rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      value={u.role}
                      onChange={(e) => roleMut.mutate({ id: u._id, role: e.target.value as any })}
                      disabled={roleMut.isPending}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="STAFF">STAFF</option>
                    </select>
                  </div>

                  <div>
                    <select
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        u.status === "ACTIVE" 
                          ? "border-green-200 bg-green-50 text-green-800" 
                          : "border-red-200 bg-red-50 text-red-800"
                      }`}
                      value={u.status}
                      onChange={(e) => statusMut.mutate({ id: u._id, status: e.target.value as any })}
                      disabled={statusMut.isPending}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-6">
              <button 
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || !hasPrevPage}
              >
                Previous
              </button>
              <div className="text-gray-700 font-medium">Page {page} of {totalPages}</div>
              <button 
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNextPage || page >= totalPages}
              >
                Next
              </button>
            </div>
          </>
        ) : null}
      </div>
    </RequireAuth>
  );
}