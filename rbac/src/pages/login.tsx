import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMut = useMutation({
    mutationFn: async () => {
      return apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },
    onSuccess: (data: any) => {
      setAuth({ token: data.token, user: data.user });
      router.push("/");
    },
  });

    return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-gray-100">
        <h1 className="text-3xl font-semibold text-gray-900 text-center">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-gray-500 text-center">
          Sign in to your account
        </p>

        <div className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-lg text-black border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-black focus:border-black focus:text-black"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full text-black rounded-lg border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-black focus:border-black focus:text-black"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {loginMut.isError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {(loginMut.error as any).message}
            </div>
          )}

          <button
            onClick={() => loginMut.mutate()}
            disabled={loginMut.isPending}
            className="w-full rounded-lg bg-blue-500 py-2.5 text-m font-medium text-white
                       transition hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed hover:cursor-pointer"
          >
            {loginMut.isPending ? "Logging in..." : "Login"}
          </button>

          <div className="text-center space-y-3 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Are you an Admin or have a registration token?
            </p>
            <button
              onClick={() => router.push("/register")}
              className="w-full rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700
                         transition hover:bg-gray-50 hover:border-gray-400 hover:cursor-pointer"
            >
              Go to Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
