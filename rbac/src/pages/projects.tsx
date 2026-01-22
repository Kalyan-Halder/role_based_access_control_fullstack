import RequireAuth from "../components/RequireAuth";
import Nav from "../components/Nav";
import { apiFetch } from "../lib/api";
import { AuthContext } from "../context/AuthContext";
import { useContext, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Project = {
  _id: string;
  name: string;
  description: string;
  creator_Name: string;
  creator_Email: string;
  status: "ACTIVE" | "ARCHIVED" | "DELETED";
  isDeleted: boolean;
};

export default function ProjectsPage() {
  const { auth } = useContext(AuthContext);
  const isAdmin = auth?.user.role === "ADMIN";

  const user = auth?.user
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  

  const projectsQ = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiFetch("/projects"),
    staleTime: 30_000,
  });

  const createMut = useMutation({
    mutationFn: () =>
      apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify({
           name, description,
           userID: user?.id,
          }),
      }),
    onSuccess: () => {
      setName("");
      setDescription("");
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const archiveMut = useMutation({
    mutationFn: (p: Project) =>
      apiFetch(`/projects/${p._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: p.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED" }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  return (
    <RequireAuth>
      <Nav />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-white">Projects</h1>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="font-semibold text-lg mb-4 text-gray-800">Create Project</h2>
          <div className="space-y-4">
            <input
              className="w-full px-4 py-3 rounded-lg border text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="w-full px-4 py-3 text-black rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button
              className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-70"
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending || !name}
            >
              {createMut.isPending ? "Creating..." : "Create Project"}
            </button>
            {createMut.isError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                <p className="text-red-700 text-sm">{(createMut.error as any).message}</p>
              </div>
            ) : null}
          </div>
        </div>

        {projectsQ.isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : null}
        
        {projectsQ.isError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800">{(projectsQ.error as any).message}</p>
          </div>
        ) : null}

        <div className="space-y-4">
          {(projectsQ.data || []).map((p: Project) => (
            <div key={p._id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-semibold text-gray-900">{p.name}</div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      p.status === "ACTIVE" 
                        ? "bg-green-100 text-green-800" 
                        : p.status === "ARCHIVED" 
                        ? "bg-amber-100 text-amber-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="text-gray-600 text-sm mb-2">{p.description}</div>
                  {isAdmin?(
                     <div>
                      <div className="text-black">Creator : {p.creator_Name}</div>
                      <div className="text-black">Email : {p.creator_Email}</div>
                     </div>
                  ):(
                    <div className="text-black"></div>
                  )}
                </div>

                {isAdmin ? (
                  <div className="flex gap-2 ml-4">
                    <button
                      className="px-4 py-2 text-black rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50"
                      onClick={() => archiveMut.mutate(p)}
                      disabled={archiveMut.isPending}
                    >
                      {p.status === "ARCHIVED" ? "Unarchive" : "Archive"}
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg border border-red-300 hover:bg-red-50 text-red-700 text-sm font-medium transition-colors disabled:opacity-50"
                      onClick={() => deleteMut.mutate(p._id)}
                      disabled={deleteMut.isPending}
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 ml-4">View only</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </RequireAuth>
  );
}