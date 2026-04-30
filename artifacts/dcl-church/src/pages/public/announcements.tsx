import { useListAnnouncements } from "@workspace/api-client-react";
import { PublicLayout } from "@/components/public-layout";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Calendar, Pin } from "lucide-react";
import { formatDate } from "@/lib/format";

export default function AnnouncementsPage() {
  const { data, isLoading } = useListAnnouncements({ publicOnly: true });

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-widest text-[hsl(199,89%,38%)] font-semibold">
            What's happening
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl mt-3 text-gradient">
            Announcements
          </h1>
          <p className="mt-3 text-[hsl(215,40%,32%)]">
            Stay connected with services, events, and the life of our church
          </p>
        </div>

        <div className="mt-12 space-y-6">
          {isLoading && (
            <div className="text-center text-[hsl(215,40%,40%)]">Loading...</div>
          )}
          {!isLoading && (data?.length ?? 0) === 0 && (
            <div className="glass rounded-3xl p-12 text-center text-[hsl(215,40%,40%)]">
              No announcements yet. Check back soon.
            </div>
          )}
          {data?.map((a, i) => (
            <motion.article
              key={a.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.04 }}
              className="glass-strong rounded-3xl overflow-hidden md:flex"
              data-testid={`card-announcement-${a.id}`}
            >
              {a.mediaUrl && a.mediaType === "image" && (
                <img
                  src={a.mediaUrl}
                  alt={a.title}
                  className="md:w-72 h-56 md:h-auto object-cover flex-shrink-0"
                />
              )}
              {a.mediaUrl && a.mediaType === "video" && (
                <video
                  src={a.mediaUrl}
                  controls
                  className="md:w-72 h-56 md:h-auto object-cover flex-shrink-0"
                />
              )}
              <div className="p-7 flex-1">
                <div className="flex items-center gap-2 text-sm text-[hsl(215,40%,40%)]">
                  <Calendar className="size-4" />
                  {formatDate(a.createdAt)}
                  {a.isPinned && (
                    <Badge className="ml-2 bg-[hsl(199,89%,53%)]/15 text-[hsl(199,89%,28%)] border-0">
                      <Pin className="size-3 mr-1" />
                      Pinned
                    </Badge>
                  )}
                </div>
                <h2 className="font-serif text-2xl mt-2 text-[hsl(215,80%,22%)]">
                  {a.title}
                </h2>
                <p className="mt-3 text-[hsl(215,40%,30%)] leading-relaxed whitespace-pre-line">
                  {a.body}
                </p>
                {a.mediaUrl && a.mediaType === "audio" && (
                  <audio src={a.mediaUrl} controls className="mt-4 w-full" />
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
