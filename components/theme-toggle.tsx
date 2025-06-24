import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center space-x-2 bg-gray-100 rounded-full p-1">
      <Button
        variant={theme === "light" ? "default" : "ghost"}
        size="sm"
        onClick={() => setTheme("light")}
        className="rounded-full h-8 w-8 p-0 bg-amber-500 hover:bg-amber-600 text-white"
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === "dark" ? "default" : "ghost"}
        size="sm"
        onClick={() => setTheme("dark")}
        className="rounded-full h-8 w-8 p-0"
      >
        <Moon className="h-4 w-4" />
      </Button>
    </div>
  );
}
