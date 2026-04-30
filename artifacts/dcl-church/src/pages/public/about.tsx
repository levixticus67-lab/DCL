import {
  useGetSiteSettings,
  useGetPublicSite,
} from "@workspace/api-client-react";
import { PublicLayout } from "@/components/public-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { roleLabel } from "@/lib/format";

export default function AboutPage() {
  const { data: settings } = useGetSiteSettings();
  const { data: site } = useGetPublicSite();
  const leaders = site?.leadership ?? [];

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="text-xs uppercase tracking-widest text-[hsl(199,89%,38%)] font-semibold">
            About us
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl mt-3 text-gradient">
            Who we are
          </h1>
          <p className="mt-4 text-[hsl(215,40%,30%)]">
            A Pentecostal church serving Lugazi and the surrounding region with
            the unchanging Gospel of Jesus Christ.
          </p>
        </motion.div>

        <div className="mt-14 grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-strong rounded-3xl p-8"
          >
            <div className="text-xs uppercase tracking-widest text-[hsl(199,89%,38%)] font-semibold">
              Mission
            </div>
            <p className="mt-3 font-serif text-xl text-[hsl(215,80%,22%)] leading-snug">
              {settings?.missionStatement}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="glass-strong rounded-3xl p-8"
          >
            <div className="text-xs uppercase tracking-widest text-[hsl(199,89%,38%)] font-semibold">
              Vision
            </div>
            <p className="mt-3 font-serif text-xl text-[hsl(215,80%,22%)] leading-snug">
              {settings?.visionStatement}
            </p>
          </motion.div>
        </div>

        <div className="mt-12">
          <h2 className="font-serif text-3xl text-[hsl(215,80%,22%)] text-center">
            Core values
          </h2>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(settings?.coreValues ?? []).map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="glass rounded-2xl p-5 flex items-start gap-3"
                data-testid={`card-value-${i}`}
              >
                <CheckCircle2 className="size-5 text-[hsl(199,89%,45%)] flex-shrink-0 mt-0.5" />
                <span className="text-[hsl(215,80%,22%)] font-medium">{v}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {leaders.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-3xl text-[hsl(215,80%,22%)] text-center">
              Leadership
            </h2>
            <p className="text-center mt-2 text-[hsl(215,40%,32%)]">
              The pastors and ministers who shepherd this house
            </p>
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {leaders.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="glass rounded-2xl p-6 flex gap-4"
                >
                  <Avatar className="size-16 ring-2 ring-white/80 flex-shrink-0">
                    {p.photoUrl && <AvatarImage src={p.photoUrl} />}
                    <AvatarFallback className="bg-gradient-to-br from-[hsl(215,80%,32%)] to-[hsl(199,89%,53%)] text-white font-serif">
                      {p.fullName
                        .split(" ")
                        .filter((s) => !s.endsWith("."))
                        .map((s) => s[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-serif text-lg text-[hsl(215,80%,22%)]">
                      {p.fullName}
                    </div>
                    <div className="text-xs uppercase tracking-widest text-[hsl(199,89%,38%)] mt-0.5">
                      {roleLabel(p.role)}
                    </div>
                    {p.bio && (
                      <p className="mt-2 text-sm text-[hsl(215,40%,32%)] line-clamp-3">
                        {p.bio}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
