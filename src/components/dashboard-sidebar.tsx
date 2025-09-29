"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart3, Upload, LogOut, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";

const navigation = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: BarChart3,
    description: "Dashboard overview and key metrics",
  },
  {
    name: "Data Upload",
    href: "/dashboard/upload",
    icon: Upload,
    description: "Upload Excel files",
  },
];

interface DashboardSidebarProps {
  className?: string;
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { setUser } = useAuth();
  const router = useRouter();
  const { mutateAsync, isPending } = useLogout();

  const handleSignOut = async () => {
    await mutateAsync();
    setUser(null);
    router.push("/login");
  };

  return (
    <div
      className={cn(
        "flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border",
        className
      )}
    >
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">
              Data Dashboard
            </span>
            <span className="text-xs text-muted-foreground">
              Analytics Platform
            </span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          <div className="px-3 py-2">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2 h-9",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    asChild
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-3">
        <Button
          disabled={isPending}
          variant="ghost"
          className="w-full justify-start gap-2 h-9 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={handleSignOut}
        >
          {isPending ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Sign Out
        </Button>
      </div>
    </div>
  );
}
