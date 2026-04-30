import {
  useGetSiteSettings,
  useListSocialLinks,
} from "@workspace/api-client-react";
import { Church, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "wouter";

export function SiteFooter() {
  const { data: settings } = useGetSiteSettings();
  const { data: socials } = useListSocialLinks();

  return (
    <footer className="mt-24 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-strong rounded-3xl px-6 sm:px-10 py-10">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] grid place-items-center text-white">
                  <Church className="size-5" />
                </div>
                <div>
                  <div className="font-serif text-lg font-bold text-[hsl(215,80%,22%)]">
                    {settings?.churchName ?? "Deliverance Church Lugazi"}
                  </div>
                  <div className="text-xs uppercase tracking-widest text-[hsl(215,40%,40%)]">
                    {settings?.tagline ?? "Christ at the centre"}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-[hsl(215,40%,30%)] max-w-sm">
                A Christ-centered community of believers in Lugazi and beyond.
                Come as you are; leave transformed.
              </p>
            </div>

            <div className="space-y-2 text-sm text-[hsl(215,40%,28%)]">
              <div className="font-semibold text-[hsl(215,80%,22%)] mb-2">
                Visit & Contact
              </div>
              {settings?.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="size-4 mt-0.5 flex-shrink-0" />
                  <span>{settings.address}</span>
                </div>
              )}
              {settings?.primaryPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="size-4" />
                  <span>{settings.primaryPhone}</span>
                </div>
              )}
              {settings?.primaryEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="size-4" />
                  <span>{settings.primaryEmail}</span>
                </div>
              )}
            </div>

            <div>
              <div className="font-semibold text-[hsl(215,80%,22%)] mb-3">
                Connect
              </div>
              <div className="flex flex-wrap gap-2">
                {socials?.filter((s) => s.isActive).map((s) => (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-full text-sm bg-white/60 hover:bg-white/80 transition-colors text-[hsl(215,80%,22%)] border border-white/70"
                    data-testid={`link-social-${s.platform.toLowerCase()}`}
                  >
                    {s.platform}
                  </a>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-1 text-xs text-[hsl(215,40%,40%)]">
                <Link href="/about" className="hover:underline">
                  Our story
                </Link>
                <Link href="/announcements" className="hover:underline">
                  Announcements
                </Link>
                <Link href="/branches" className="hover:underline">
                  Find a branch
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-white/40 text-center text-xs text-[hsl(215,40%,40%)]">
            © {new Date().getFullYear()} {settings?.churchName ?? "Deliverance Church Lugazi"}. All glory to God.
          </div>
        </div>
      </div>
    </footer>
  );
}
