import { useGetPublicSite } from "@workspace/api-client-react";
import { PublicLayout } from "@/components/public-layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Heart,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { roleLabel, formatDate } from "@/lib/format";

export default function HomePage() {
  const { data, isLoading } = useGetPublicSite();
  const settings = data?.settings;
  const branches = data?.branches ?? [];
  const leaders = data?.leadership ?? [];
  const announcements = data?.announcements ?? [];

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-6 bg-white/60 text-[hsl(215,80%,28%)] border-white/70 backdrop-blur">
              <Sparkles className="size-3 mr-1.5" />
              Welcome to {settings?.abbreviation ?? "DCL"}
            </Badge>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="text-gradient">
                {settings?.churchName ?? "Deliverance Church Lugazi"}
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-[hsl(215,40%,28%)] max-w-2xl mx-auto">
              {settings?.tagline ?? "A Christ-centered community lifting Jesus over Lugazi."}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/about">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white shadow-lg hover:opacity-95 rounded-full px-7"
                  data-testid="button-our-story"
                >
                  Our story
                  <ArrowRight className="size-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/branches">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full bg-white/60 hover:bg-white/80 border-white/80 text-[hsl(215,80%,22%)]"
                  data-testid="button-find-branch"
                >
                  Find a branch
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Floating glass stats */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto"
          >
            <StatCard
              icon={<MapPin className="size-5" />}
              label="Branches"
              value={isLoading ? "—" : String(branches.length)}
            />
            <StatCard
              icon={<Users className="size-5" />}
              label="Leaders"
              value={isLoading ? "—" : String(leaders.length)}
            />
            <StatCard
              icon={<Heart className="size-5" />}
              label="Established"
              value="Lugazi"
            />
          </motion.div>
        </div>
      </section>

      {/* Mission / Vision */}
      <Section
        eyebrow="Why we exist"
        title="Mission & Vision"
        subtitle="The heartbeat of our community"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass-strong rounded-3xl p-8"
          >
            <div className="text-xs uppercase tracking-widest text-[hsl(199,89%,38%)] font-semibold">
              Mission
            </div>
            <h3 className="font-serif text-2xl mt-2 text-[hsl(215,80%,22%)]">
              To know Christ and to make Him known
            </h3>
            <p className="mt-4 text-[hsl(215,40%,28%)] leading-relaxed">
              {settings?.missionStatement}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-strong rounded-3xl p-8"
          >
            <div className="text-xs uppercase tracking-widest text-[hsl(199,89%,38%)] font-semibold">
              Vision
            </div>
            <h3 className="font-serif text-2xl mt-2 text-[hsl(215,80%,22%)]">
              A community transformed by the Gospel
            </h3>
            <p className="mt-4 text-[hsl(215,40%,28%)] leading-relaxed">
              {settings?.visionStatement}
            </p>
          </motion.div>
        </div>
      </Section>

      {/* Leaders */}
      {leaders.length > 0 && (
        <Section
          eyebrow="Our shepherds"
          title="Pastors & Ministers"
          subtitle="The team God has called to serve this house"
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {leaders.slice(0, 8).map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="glass rounded-2xl p-6 text-center"
                data-testid={`card-leader-${p.id}`}
              >
                <Avatar className="size-20 mx-auto ring-2 ring-white/80 shadow-lg">
                  {p.photoUrl && <AvatarImage src={p.photoUrl} />}
                  <AvatarFallback className="bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] text-white font-serif text-xl">
                    {p.fullName
                      .split(" ")
                      .filter((s) => !s.endsWith("."))
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-4 font-serif text-lg text-[hsl(215,80%,22%)]">
                  {p.fullName}
                </div>
                <div className="text-xs uppercase tracking-widest text-[hsl(199,89%,38%)] mt-1">
                  {roleLabel(p.role)}
                </div>
                {p.bio && (
                  <p className="mt-3 text-sm text-[hsl(215,40%,32%)] line-clamp-3">
                    {p.bio}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <Section
          eyebrow="What's new"
          title="Latest announcements"
          subtitle="Keep up with what God is doing among us"
          action={
            <Link
              href="/announcements"
              className="text-sm font-medium text-[hsl(215,80%,32%)] hover:underline inline-flex items-center gap-1"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          }
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {announcements.slice(0, 6).map((a, i) => (
              <motion.article
                key={a.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="glass rounded-2xl overflow-hidden flex flex-col"
                data-testid={`card-announcement-${a.id}`}
              >
                {a.mediaUrl && a.mediaType === "image" && (
                  <img
                    src={a.mediaUrl}
                    alt={a.title}
                    className="w-full h-44 object-cover"
                  />
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-xs text-[hsl(215,40%,40%)]">
                    <Calendar className="size-3.5" />
                    <span>{formatDate(a.createdAt)}</span>
                    {a.isPinned && (
                      <Badge className="ml-auto bg-[hsl(199,89%,53%)]/15 text-[hsl(199,89%,30%)] border-0">
                        Pinned
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-serif text-xl mt-2 text-[hsl(215,80%,22%)]">
                    {a.title}
                  </h3>
                  <p className="mt-2 text-sm text-[hsl(215,40%,30%)] line-clamp-3 flex-1">
                    {a.body}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </Section>
      )}

      {/* Branches */}
      {branches.length > 0 && (
        <Section
          eyebrow="Find us"
          title="Our branches"
          subtitle="Three locations, one family in Christ"
        >
          <div className="grid md:grid-cols-3 gap-5">
            {branches.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="glass-strong rounded-3xl p-8"
                data-testid={`card-branch-${b.id}`}
              >
                {b.isMain && (
                  <Badge className="mb-3 bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white border-0">
                    Main Branch
                  </Badge>
                )}
                <h3 className="font-serif text-2xl text-[hsl(215,80%,22%)]">
                  {b.name}
                </h3>
                <div className="mt-2 flex items-center gap-2 text-sm text-[hsl(215,40%,32%)]">
                  <MapPin className="size-4" />
                  {b.location}
                </div>
                {b.pastorInChargeName && (
                  <div className="mt-4 text-sm">
                    <div className="text-xs uppercase tracking-widest text-[hsl(199,89%,38%)]">
                      Pastor in charge
                    </div>
                    <div className="font-medium text-[hsl(215,80%,22%)] mt-1">
                      {b.pastorInChargeName}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </Section>
      )}
    </PublicLayout>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass rounded-2xl px-6 py-5 flex items-center gap-4">
      <div className="size-12 rounded-xl bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] grid place-items-center text-white shadow-md">
        {icon}
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest text-[hsl(215,40%,40%)]">
          {label}
        </div>
        <div className="font-serif text-2xl text-[hsl(215,80%,22%)]">
          {value}
        </div>
      </div>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  subtitle,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-xs uppercase tracking-widest text-[hsl(199,89%,38%)] font-semibold">
              {eyebrow}
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl mt-2 text-[hsl(215,80%,22%)]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-[hsl(215,40%,32%)]">{subtitle}</p>
            )}
          </motion.div>
          {action && <div className="hidden sm:block">{action}</div>}
        </div>
        {children}
      </div>
    </section>
  );
}
