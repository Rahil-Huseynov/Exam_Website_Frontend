"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { toast } from "react-toastify"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

const AlertVariantContext = React.createContext<"default" | "destructive">("default")

type AlertProps = React.ComponentProps<"div"> & VariantProps<typeof alertVariants>

function Alert({ className, variant, ...props }: AlertProps) {
  cn(alertVariants({ variant }), className, props)

  const v = (variant ?? "default") as "default" | "destructive"

  return <AlertVariantContext.Provider value={v}>{/* UI yoxdur */}</AlertVariantContext.Provider>
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  cn(className, props)
  return null
}
function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  const variant = React.useContext(AlertVariantContext)

  const children = (props as any).children
  const text =
    typeof children === "string"
      ? children
      : Array.isArray(children)
        ? children.filter((x) => typeof x === "string").join(" ").trim()
        : ""

  React.useEffect(() => {
    if (!text) return

    if (variant === "destructive") toast.error(text)
    else toast.info(text)
  }, [text, variant])

  cn(
    "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
    className,
    props,
  )
  return null
}

export { Alert, AlertTitle, AlertDescription }
