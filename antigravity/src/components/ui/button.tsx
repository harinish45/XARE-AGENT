"use client";

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl",
                neon: "bg-transparent border-2 border-[var(--neon-cyan)] text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)] hover:text-black hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-all duration-300",
                neonPink: "bg-transparent border-2 border-[var(--neon-pink)] text-[var(--neon-pink)] hover:bg-[var(--neon-pink)] hover:text-white hover:shadow-[0_0_20px_rgba(255,0,110,0.5)] transition-all duration-300",
                neonPurple: "bg-transparent border-2 border-[var(--neon-purple)] text-[var(--neon-purple)] hover:bg-[var(--neon-purple)] hover:text-white hover:shadow-[0_0_20px_rgba(160,32,240,0.5)] transition-all duration-300",
                neonGreen: "bg-transparent border-2 border-[var(--neon-green)] text-[var(--neon-green)] hover:bg-[var(--neon-green)] hover:text-black hover:shadow-[0_0_20px_rgba(57,255,20,0.5)] transition-all duration-300",
                glass: "glass text-white hover:bg-white/10 border border-white/20",
                destructive: "bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]",
                outline: "border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40",
                secondary: "bg-[var(--dark-elevated)] text-white hover:bg-[var(--dark-surface)] border border-white/10",
                ghost: "text-white hover:bg-white/10",
                link: "text-[var(--neon-cyan)] underline-offset-4 hover:underline hover:text-[var(--neon-pink)]",
            },
            size: {
                default: "h-11 px-6 py-2",
                sm: "h-9 rounded-md px-4 text-xs",
                lg: "h-13 rounded-lg px-8 text-base",
                icon: "h-11 w-11",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    },
)
Button.displayName = "Button"

export { Button, buttonVariants }
