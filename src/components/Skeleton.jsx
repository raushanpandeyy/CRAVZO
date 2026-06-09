import React from "react";

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-2xl bg-slate-200 ${className}`} />
);

const SkeletonCard = ({ className = "" }) => (
  <div className={`overflow-hidden rounded-[28px] bg-white shadow-sm sm:rounded-3xl ${className}`}>
    <Skeleton className="h-32 w-full sm:h-40" />
    <div className="space-y-3 p-4">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
    </div>
  </div>
);

const SkeletonRow = ({ className = "" }) => (
  <div className={`flex gap-4 rounded-3xl bg-white p-4 shadow-sm ${className}`}>
    <div className="flex-1 space-y-3">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <Skeleton className="h-28 w-28 shrink-0 rounded-2xl" />
  </div>
);

const SkeletonAvatar = ({ className = "" }) => (
  <div className={`flex flex-col items-center gap-4 ${className}`}>
    <Skeleton className="h-28 w-28 rounded-full sm:h-36 sm:w-36" />
    <Skeleton className="h-10 w-32 rounded-xl" />
  </div>
);

const SkeletonForm = ({ rows = 3, className = "" }) => (
  <div className={`space-y-5 ${className}`}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    ))}
  </div>
);

export { Skeleton, SkeletonCard, SkeletonRow, SkeletonAvatar, SkeletonForm };
