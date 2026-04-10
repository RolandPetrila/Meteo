"use client";

/**
 * Skeleton loader pentru starea initiala de incarcare.
 * Preda forma aproximativa a continutului viitor (card + tabs).
 */
export default function Skeleton() {
  return (
    <div className="animate-pulse">
      {/* Card principal skeleton */}
      <div className="mx-4 mt-4">
        <div className="rounded-3xl p-8 bg-gradient-to-br from-primary-500/70 to-primary-700/70 dark:from-primary-600/40 dark:to-primary-900/40">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="h-20 w-32 bg-white/20 rounded-2xl" />
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-white/20 rounded-full" />
                <div className="h-4 w-24 bg-white/20 rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-12 bg-white/15 rounded" />
              <div className="h-4 w-12 bg-white/15 rounded" />
            </div>
          </div>

          <div className="flex items-center gap-5 mt-6">
            <div className="h-4 w-14 bg-white/15 rounded" />
            <div className="h-4 w-20 bg-white/15 rounded" />
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
            <div className="h-3 w-full bg-white/15 rounded" />
            <div className="h-3 w-3/4 bg-white/15 rounded" />
          </div>
        </div>
      </div>

      {/* Tab bar skeleton */}
      <div className="mx-4 mt-4">
        <div className="flex gap-1 p-1 rounded-2xl bg-gray-100 dark:bg-dark-card">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex-1 h-10 rounded-xl bg-gray-200 dark:bg-dark-surface"
            />
          ))}
        </div>
      </div>

      {/* Continut tab skeleton */}
      <div className="mx-4 mt-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border"
          />
        ))}
      </div>
    </div>
  );
}
