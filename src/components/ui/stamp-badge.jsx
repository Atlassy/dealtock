import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const stampBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm border-l-4 bg-white px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wide",
  {
    variants: {
      variant: {
        verified: "border-stamp-green text-stamp-green",
        alert: "border-stamp-red text-stamp-red",
        kraft: "border-kraft-500 text-kraft-700",
      },
    },
    defaultVariants: {
      variant: "kraft",
    },
  }
)

function StampBadge({ className, variant, ...props }) {
  return (
    <div className={cn(stampBadgeVariants({ variant }), className)} {...props} />
  )
}

export { StampBadge, stampBadgeVariants }
