// components/Layout.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Home, Users, Bus, FileText, LogOut, Bell, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import ThemeToggle from "./theme-toggle";
import { supabase } from "@/lib/supabaseClient"; // <-- use your client

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(pathname);
  const [navOpen, setNavOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: <Home className="h-4 w-4" /> },
    { name: "Bookings", href: "/admin/bookings", icon: <Users className="h-4 w-4" /> },
    { name: "Inquiries", href: "/admin/requests", icon: <Bus className="h-4 w-4" /> },
    { name: "Reports", href: "/admin/reports", icon: <FileText className="h-4 w-4" /> },
  ];

  // Supabase logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-white rounded-lg flex items-center justify-center p-1">
                <Image
                  src="/images/reeca-travel-logo.png"
                  alt="Reeca Travel"
                  width={40}
                  height={24}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-teal-900">Reeca Travel Admin</h1>
                <p className="text-xs text-amber-600">Bus Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </Button>
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                className="text-teal-600 border-teal-600 hover:bg-teal-50 hidden md:flex"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
              {/* Hamburger menu for mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setNavOpen((v) => !v)}
                aria-label="Toggle navigation"
              >
                {navOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8 flex flex-1 relative">
        {/* Sidebar for desktop */}
        <nav className="w-64 pr-4 hidden md:block">
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <div
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                        activeTab === item.href
                          ? "bg-teal-50 text-teal-600"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => setActiveTab(item.href)}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              size="sm"
              className="text-teal-600 border-teal-600 hover:bg-teal-50 mt-6 w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </nav>
        {/* Sidebar for mobile */}
        {navOpen && (
          <nav className="fixed inset-0 z-40 bg-black bg-opacity-40 flex md:hidden">
            <div className="w-64 bg-white border-r shadow-lg h-full p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-teal-700 text-lg">Menu</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNavOpen(false)}
                  aria-label="Close navigation"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <ul className="space-y-1 flex-1">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <div
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                          activeTab === item.href
                            ? "bg-teal-50 text-teal-600"
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          setActiveTab(item.href);
                          setNavOpen(false);
                        }}
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="text-teal-600 border-teal-600 hover:bg-teal-50 mt-6 w-full"
                onClick={() => {
                  setNavOpen(false);
                  handleLogout();
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
            {/* Click outside to close */}
            <div className="flex-1" onClick={() => setNavOpen(false)} />
          </nav>
        )}
        <main className="flex-1 pl-0 md:pl-4">{children}</main>
      </div>
    </div>
  );
}

