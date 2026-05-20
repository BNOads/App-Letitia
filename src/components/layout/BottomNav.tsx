import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, CheckSquare, FileText, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Tarefas", href: "/tarefas", icon: CheckSquare },
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Editorial", href: "/editorial", icon: FileText },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-card/80 backdrop-blur-lg border-t border-border/50 flex items-center justify-around px-1 transition-all duration-300">
      {navigation.map((item) => {
        const isActive = item.href === "/" ? location.pathname === "/" : location.pathname.startsWith(item.href);
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-0.5 transition-colors",
              isActive ? "text-foreground" : "text-muted hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-5 w-5", isActive ? "text-letitia-clay" : "")} aria-hidden="true" />
            <span className="text-[9px] font-medium">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
