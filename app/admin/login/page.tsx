"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";


export default function AdminLogin() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      router.push("/admin");
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: { data: { name: regName } },
    });
    if (error) {
      setError(error.message);
    } else {
      router.push("/admin");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Reeca Travel" className="h-12" />
        </div>
        <div className="flex mb-6">
          <button
            className={`flex-1 py-2 font-semibold rounded-l ${tab === "login" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-700"}`}
            onClick={() => setTab("login")}
          >
            Login
          </button>
          <button
            className={`flex-1 py-2 font-semibold rounded-r ${tab === "register" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-700"}`}
            onClick={() => setTab("register")}
          >
            Create Account
          </button>
        </div>
        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2"
                placeholder="admin@reeca.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2"
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <Button type="submit" className="w-full bg-teal-600 text-white">Login</Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                placeholder="Your name"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2"
                placeholder="you@reeca.com"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2"
                placeholder="Create a password"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-teal-600 text-white">Create Account</Button>
          </form>
        )}
      </div>
    </div>
  );
}