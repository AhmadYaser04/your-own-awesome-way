import { Link, NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { useState, type ReactNode } from "react";
import { Languages, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLang } from "@/i18n/LanguageProvider";
import logo from "@/assets/aut-logo-full.jpg";

const AUT_URL = "https://www.aut.edu.jo/home/ar";

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
  const { t, lang, toggle, dir } = useLang();

  const NAV = [
    { to: "/", label: t("nav.home") },
    { to: "/college", label: t("nav.college") },
    { to: "/equivalency", label: t("nav.equivalency") },
    { to: "/about", label: t("nav.about") },
    { to: "/faq", label: t("nav.faq") },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={dir}>
      <header className="bg-primary py-3 px-4 md:px-6 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between gap-4">
          {/* Logo opens AUT website in new tab */}
          <a
            href={AUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 min-w-0 group"
            onClick={() => setOpen(false)}
            aria-label={t("footer.officialSite")}
            title={t("footer.officialSite")}
          >
            <img
              src={logo}
              alt={lang === "ar" ? "شعار جامعة العقبة للتكنولوجيا" : "Aqaba University of Technology logo"}
              width={56}
              height={48}
              className="h-11 w-auto rounded-md bg-card object-contain shrink-0 px-1.5 py-1 group-hover:scale-105 transition-transform"
            />
            <div className="text-primary-foreground min-w-0 hidden sm:block">
              <h1 className="font-heading text-sm md:text-base font-bold leading-tight truncate">
                {t("header.title")}
              </h1>
              <p className="text-[10px] md:text-xs opacity-75 truncate">{t("header.subtitle")}</p>
            </div>
          </a>

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
              onClick={toggle}
              aria-label="Switch language"
              className="hidden md:inline-flex text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground gap-1.5"
            >
              <Languages className="h-4 w-4" />
              <span className="text-xs font-bold">{t("header.toggleLang")}</span>
            </Button>
            {/* Mobile language toggle (icon-only) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Switch language"
              className="md:hidden text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Languages className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("header.menu")}
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
            <a href={AUT_URL} target="_blank" rel="noopener noreferrer">
              <img src={logo} alt="" className="h-10 w-auto rounded-md bg-card object-contain px-1.5 py-1" />
            </a>
            <span className="font-bold">{t("footer.uni")}</span>
          </div>
          <p>{t("footer.copy")}</p>
          <p className="text-xs opacity-75">
            {t("footer.poweredBy")} ·{" "}
            <a
              href={AUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gold transition-colors"
            >
              {t("footer.officialSite")}
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
