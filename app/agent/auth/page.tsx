"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export default function AgentAuth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const payload = mode === "login" ? { email, password } : { name, email, password };
      const endpoint = mode === "login" ? "/api/agent/login" : "/api/agent/register";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        if (mode === "login") {
          window.location.href = "/agent/dashboard";
        } else {
          setSuccess(true);
          setName("");
          setEmail("");
          setPassword("");
          setMode("login");
        }
      } else {
        setError(data.error || `${mode === "login" ? "Login" : "Registration"} failed`);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        {/* Left: Image */}
        <div className="hidden lg:block relative h-[600px]">
          <Image
            src="https://scontent.fgbe3-1.fna.fbcdn.net/v/t39.30808-6/490288377_1108592554641180_543926921775620148_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeHo-NUzCD65Ynemwu1LsbA_aC8R33kN3CRoLxHfeQ3cJBrTITyWXZQM5DDj91L8d_qYkS_AVue5EhrO2N8vHYdo&_nc_ohc=HVpRAXFCOHgQ7kNvwEKEM2U&_nc_oc=Adk8EBzzIIWuONzxFCRQCnbCASzq3lBrBkAUfhFzob05Pk-8ty6PggEaGhTT55zU1CI&_nc_zt=23&_nc_ht=scontent.fgbe3-1.fna&_nc_gid=TFSY26WjG6QYapdN6hyivQ&oh=00_AfTCtbeHBQbC9LtLfw10e-aJxSPkPJuYkdq-Vqkc5EmKIg&oe=6881E5BE"
            alt="Bus travel image"
            fill
            className="object-cover"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/30 flex items-end p-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Bus Booking System</h2>
              <p className="text-teal-200">
                {mode === "login" 
                  ? "Manage bookings and serve your clients efficiently"
                  : "Join our network of professional booking agents"}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="https://scontent.fgbe3-1.fna.fbcdn.net/v/t39.30808-6/490440252_1108879161279186_7731004643176883427_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=104&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeEXHmXGZsRP_9hvRcmdOEBk1-JoOeb96jnX4mg55v3qOZBZJk_3ZtUDnkXWsqOJ0IhmI6r6fzVsgQ541COknQUo&_nc_ohc=qRS4Bz3FuxIQ7kNvwFvlWhZ&_nc_oc=AdlJXNS-BXp_pSUen_jXzQCNhY1-LWYPAuILnR1Jy_W_-245a1ev24y6kX3FaUuBd_k&_nc_zt=23&_nc_ht=scontent.fgbe3-1.fna&_nc_gid=pDFB9BfJQub07_dmy5UkHQ&oh=00_AfS8ZIeeyr9ny3UaJd9MhbsoPtUzsAyNUWTlzyUCH944hA&oe=6881E529"
                alt="Company Logo"
                width={60}
                height={60}
                className="rounded-lg"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {mode === "login" ? "Agent Sign In" : "Create Agent Account"}
            </h2>
            <p className="text-gray-500 mt-2">
              {mode === "login"
                ? "Access your booking dashboard"
                : "Register to start managing bookings"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "register" && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="py-3 px-4"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="agent@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="py-3 px-4"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="py-3 px-4"
              />
            </div>

            {mode === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 text-green-600 text-sm rounded-md flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Registration successful! Your account will be reviewed by Reeca management. You will be able to log in once your agent account is approved.
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg shadow-sm transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Register"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    setMode("register");
                    setError("");
                    setSuccess(false);
                  }}
                  className="text-teal-600 font-semibold hover:text-teal-700 hover:underline"
                >
                  Register here
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setSuccess(false);
                  }}
                  className="text-teal-600 font-semibold hover:text-teal-700 hover:underline"
                >
                  Sign in here
                </button>
              </>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}