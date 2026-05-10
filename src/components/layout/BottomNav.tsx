import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, CheckSquare, Users, LineChart, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Tarefas", href: "/tarefas", icon: CheckSquare },
  { name: "CRM", href: "/crm", icon: Users },
  { name: "Vendas", href: "/vendas", icon: LineChart },
  { name: "Editorial", href: "/conteudo", icon: FileText },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t border-border flex items-center justify-around px-1">
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
