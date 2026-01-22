import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const t = router.query.token;
    if (typeof t === "string") setToken(t);
  }, [router.query.token]);

  const regMut = useMutation({
    mutationFn: async () => {
      return apiFetch("/auth/register-via-invite", {
        method: "POST",
        body: JSON.stringify({ token, name, password }),
      });
    },
    onSuccess: () => {
      router.push("/login");
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 px-4 bg-gray-900">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Register (Invite)</h1>
        <p className="text-gray-500 text-center mb-8">Complete your registration</p>

        <div className="space-y-6">
          <div>
            <input
              className="w-full px-4 py-3 rounded-xl text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="Invite token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={!!router.query.token}
            />
          </div>
          
          <div>
            <input
              className="w-full px-4 py-3 text-black rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div>
            <input
              className="w-full px-4 py-3 text-black rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {regMut.isError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 text-sm font-medium">{(regMut.error as any).message}</p>
            </div>
          ) : null}

          <button
            className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed hover:cursor-pointer"
            onClick={() => regMut.mutate()}
            disabled={regMut.isPending}
          >
            {regMut.isPending ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </span>
            ) : (
              "Create account"
            )}
          </button>
          <div className="text-center space-y-3 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Already a Registered Member?
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700
                         transition hover:bg-gray-50 hover:border-gray-400 hover:cursor-pointer"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}