import { useListBranches } from "@workspace/api-client-react";
import { PublicLayout } from "@/components/public-layout";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Mail, MapPin, Phone, UserCircle } from "lucide-react";

export default function BranchesPage() {
  const { data, isLoading } = useListBranches();

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-widest text-[hsl(199,89%,38%)] font-semibold">
            Find us
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl mt-3 text-gradient">
            Our branches
          </h1>
          <p className="mt-3 text-[hsl(215,40%,32%)]">
            One family in Christ across multiple locations in Lugazi
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && (
            <div className="col-span-full text-center text-[hsl(215,40%,40%)]">
              Loading...
            </div>
          )}
          {data?.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="glass-strong rounded-3xl p-8"
              data-testid={`card-branch-${b.id}`}
            >
              {b.isMain && (
                <Badge className="mb-3 bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)] text-white border-0">
                  Main Branch
                </Badge>
              )}
              <h2 className="font-serif text-2xl text-[hsl(215,80%,22%)]">
                {b.name}
              </h2>
              <div className="mt-3 space-y-2 text-sm text-[hsl(215,40%,30%)]">
                <div className="flex items-start gap-2">
                  <MapPin className="size-4 mt-0.5 flex-shrink-0" />
                  <span>{b.location}</span>
                </div>
                {b.pastorInChargeName && (
                  <div className="flex items-center gap-2">
                    <UserCircle className="size-4" />
                    <span>{b.pastorInChargeName}</span>
                  </div>
                )}
                {b.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-4" />
                    <span>{b.contactPhone}</span>
                  </div>
                )}
                {b.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="size-4" />
                    <span className="break-all">{b.contactEmail}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
