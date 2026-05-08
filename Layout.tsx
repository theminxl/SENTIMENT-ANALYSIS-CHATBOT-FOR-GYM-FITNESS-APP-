import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Activity, LayoutDashboard, MessageSquare, TrendingUp, Salad, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Home", icon: Activity },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chat", label: "AI Coach", icon: MessageSquare },
  { to: "/trends", label: "Trends", icon: TrendingUp },
  { to: "/diet", label: "Diet & Fitness", icon: Salad },
];

export default function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex w-full">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] rounded-full bg-primary/20 blur-[120px] animate-float-slow" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-secondary/20 blur-[120px] animate-float" />
        <div className="absolute top-1/3 right-1/4 w-[20rem] h-[20rem] rounded-full bg-accent/10 blur-[100px] animate-float-slow" />
        <div className="absolute inset-0 grid-bg opacity-40" />
      </div>

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 p-4 sticky top-0 h-screen">
        <div className="glass-card p-5 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-primary">
              <Zap className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">PULSE</div>
              <div className="text-[10px] mono text-muted-foreground uppercase tracking-widest">v.2026</div>
            </div>
          </div>
          <nav className="flex flex-col gap-1 flex-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300",
                    "hover:bg-white/5 hover:translate-x-1",
                    isActive
                      ? "bg-gradient-to-r from-primary/20 to-secondary/10 text-primary border border-primary/30 glow-primary"
                      : "text-muted-foreground"
                  )
                }
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="glass rounded-xl p-3 mt-4">
            <div className="text-[10px] mono text-primary uppercase tracking-widest mb-1">Status</div>
            <div className="text-xs text-foreground/80">All systems optimal</div>
            <div className="flex gap-1 mt-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
              <span className="w-2 h-2 rounded-full bg-primary/40" />
              <span className="w-2 h-2 rounded-full bg-primary/40" />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 glass-card p-2 flex justify-around">
        {nav.map(({ to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "p-3 rounded-lg transition-all",
                isActive ? "bg-primary/20 text-primary" : "text-muted-foreground"
              )
            }
          >
            <Icon className="w-5 h-5" />
          </NavLink>
        ))}
      </div>

      {/* Main */}
      <main key={pathname} className="flex-1 min-w-0 animate-fade-up pb-24 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
