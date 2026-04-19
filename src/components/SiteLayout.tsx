import { Link, NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { useState, type ReactNode } from "react";
import { Languages, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/logo.png";

const NAV = [
  { to: "/", label: "الرئيسية" },
  { to: "/college", label: "كلية الذكاء الاصطناعي" },
  { to: "/equivalency", label: "معادلة المواد" },
  { to: "/about", label: "حول المشروع" },
  { to: "/faq", label: "الأسئلة الشائعة" },
];

function NavItem({ to, children }: { to: string; children: ReactNode }) {
  return (
    <RouterNavLink
      to={to}
      end
      className={({ isActive }) =>
        `px-3 py-2 rounded-md text-sm font-heading font-medium transition-colors ${
          isActive
            ? "bg-primary-foreground/15 text-primary-foreground"
            : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
        }`
      }
    >
      {children}
    </RouterNavLink>
  );
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <header className="bg-primary py-3 px-4 md:px-6 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0 group" onClick={() => setOpen(false)}>
            <img
              src={logo}
              alt="شعار جامعة العقبة للتكنولوجيا"
              width={48}
              height={48}
              className="h-11 w-11 rounded-full bg-card object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="text-primary-foreground min-w-0 hidden sm:block">
              <h1 className="font-heading text-sm md:text-base font-bold leading-tight truncate">
                جامعة العقبة للتكنولوجيا
              </h1>
              <p className="text-[10px] md:text-xs opacity-75 truncate">نظام معادلة المواد الذكي</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => (
              <NavItem key={n.to} to={n.to}>
                {n.label}
              </NavItem>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" />
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground gap-1.5"
            >
              <Languages className="h-4 w-4" />
              <span className="text-xs font-bold">EN</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="القائمة"
              className="lg:hidden text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {open && (
          <nav className="lg:hidden mt-3 pb-2 flex flex-col gap-1 border-t border-primary-foreground/15 pt-3">
            {NAV.map((n) => (
              <RouterNavLink
                key={n.to}
                to={n.to}
                end
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-md text-sm font-heading font-medium ${
                    isActive
                      ? "bg-primary-foreground/15 text-primary-foreground"
                      : "text-primary-foreground/85 hover:bg-primary-foreground/10"
                  }`
                }
              >
                {n.label}
              </RouterNavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1" key={location.pathname}>
        {children}
      </main>

      <footer className="bg-primary py-7 mt-12">
        <div className="container mx-auto px-4 text-center text-primary-foreground/85 text-sm font-heading space-y-2">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src={logo} alt="" className="h-9 w-9 rounded-full bg-card object-contain" />
            <span className="font-bold">جامعة العقبة للتكنولوجيا</span>
          </div>
          <p>© 2026 نظام معادلة المواد الذكي - مشروع تخرج تخصص الذكاء الاصطناعي</p>
          <p className="text-xs opacity-75">
            مدعوم بالذكاء الاصطناعي عبر Lovable AI ·{" "}
            <a
              href="https://www.aut.edu.jo/home/ar"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gold transition-colors"
            >
              الموقع الرسمي للجامعة
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
