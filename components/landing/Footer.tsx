import Link from "next/link";
import { ExternalLink } from "lucide-react";

const quickLinks = [
  { label: "Home", href: "#hero" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
  { label: "Login", href: "/login" },
  { label: "Register", href: "/register" },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5" aria-label="SkillUp RPG Home">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB] shadow-md shadow-[#2563EB]/20">
                <span className="text-base font-bold text-white">S</span>
              </div>
              <span className="text-lg font-bold text-slate-900">
                SkillUp RPG
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
              Transform your daily habits into an epic adventure. Level up
              your real life with SkillUp RPG.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 transition-colors hover:text-slate-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Legal</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href="#"
                  className="text-sm text-slate-500 transition-colors hover:text-slate-900"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-slate-500 transition-colors hover:text-slate-900"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
                >
                  <ExternalLink className="h-4 w-4" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-100 py-6 text-center">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} SkillUp RPG. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
