"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"
import { Sun, Moon } from "lucide-react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    console.log("ThemeToggle: Component mounted on client. Initial theme:", theme || systemTheme)
  }, [theme, systemTheme])

  if (!mounted) {
    return null
  }

  const currentTheme = theme === "system" ? systemTheme : theme
  const isDarkMode = currentTheme === "dark"

  const handleThemeChange = (checked: boolean) => {
    const newTheme = checked ? "dark" : "light"
    setTheme(newTheme)
    console.log("ThemeToggle: Switch clicked. Setting theme to:", newTheme)
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Sun icon for light theme indicator */}
      <Sun
        className={cn(
          "h-5 w-5 transition-colors duration-[10ms]",
          isDarkMode ? "text-muted-foreground" : "text-accent-1",
        )}
      />
      <Label htmlFor="theme-switch" className="sr-only">
        Toggle theme
      </Label>
      <Switch
        id="theme-switch"
        checked={isDarkMode}
        onCheckedChange={handleThemeChange}
        aria-label="Toggle dark mode"
        className="transition-colors duration-[10ms]"
      />
      {/* Moon icon for dark theme indicator */}
      <Moon
        className={cn(
          "h-5 w-5 transition-colors duration-[10ms]",
          isDarkMode ? "text-accent-1" : "text-muted-foreground",
        )}
      />
    </div>
  )
}
