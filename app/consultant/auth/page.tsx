"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export default function ConsultantAuth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [mobile, setMobile] = useState("");
  const [idNumber, setIdNumber] = useState("");
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
      const payload =
        mode === "login"
          ? { email, password }
          : { name, email, password, organization, mobile, idNumber };
      const endpoint =
        mode === "login"
          ? "/api/consultant/login"
          : "/api/consultant/register";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        if (mode === "login") {
          window.location.href = "/consultant/dashboard";
        } else {
          setSuccess(true);
          setName("");
          setEmail("");
          setPassword("");
          setOrganization("");
          setMobile("");
          setIdNumber("");
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
            src="/images/cons.jpg"
            alt="Consultant image"
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
                  ? "Consult your clients and manage bookings"
                  : "Join our network of professional travel consultants"}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="/images/reeca-travel-logo.jpg"
                alt="Company Logo"
                width={60}
                height={60}
                className="rounded-lg"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {mode === "login" ? "Consultant Sign In" : "Create Consultant Account"}
            </h2>
            <p className="text-gray-500 mt-2">
              {mode === "login"
                ? "Access your consultant dashboard"
                : "Register to start consulting and managing bookings"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "register" && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="py-3 px-4"
                  />
                </div>
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                    Organization
                  </label>
                  <Input
                    id="organization"
                    placeholder="Travel Co."
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    required
                    className="py-3 px-4"
                  />
                </div>
                <div>
                  <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number
                  </label>
                  <Input
                    id="mobile"
                    placeholder="0712345678"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                    className="py-3 px-4"
                  />
                </div>
                <div>
                  <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    ID Number
                  </label>
                  <Input
                    id="idNumber"
                    placeholder="ID/Passport Number"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    required
                    className="py-3 px-4"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="consultant@example.com"
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

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-center">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 text-green-600 text-sm rounded-md flex items-center">
                Registration successful! Your account will be reviewed by Reeca management. You will be able to log in once your consultant account is approved.
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg shadow-sm transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : mode === "login" ? "Sign In" : "Register"}
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
        </div>
      </div>
    </div>
  );
}