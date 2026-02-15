"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    neonBorder?: boolean;
    glowColor?: "cyan" | "pink" | "purple" | "green";
    onClick?: () => void;
}

export function GlassCard({
    children,
    className,
    hover = false,
    neonBorder = false,
    glowColor,
    onClick,
}: GlassCardProps) {
    const glowClasses = {
        cyan: "neon-glow-cyan",
        pink: "neon-glow-pink",
        purple: "neon-glow-purple",
        green: "neon-glow-green",
    };

    return (
        <motion.div
            className={cn(
                "glass rounded-xl p-6",
                hover && "glow-on-hover cursor-pointer",
                neonBorder && "neon-border-animated",
                glowColor && glowClasses[glowColor],
                className
            )}
            onClick={onClick}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            whileHover={hover ? { scale: 1.02 } : undefined}
        >
            {children}
        </motion.div>
    );
}

interface GlassCardHeaderProps {
    children: ReactNode;
    className?: string;
    icon?: ReactNode;
}

export function GlassCardHeader({
    children,
    className,
    icon,
}: GlassCardHeaderProps) {
    return (
        <div className={cn("flex items-center gap-3 mb-4", className)}>
            {icon && <div className="text-2xl">{icon}</div>}
            <h3 className="text-xl font-bold">{children}</h3>
        </div>
    );
}

interface GlassCardContentProps {
    children: ReactNode;
    className?: string;
}

export function GlassCardContent({
    children,
    className,
}: GlassCardContentProps) {
    return (
        <div className={cn("text-sm text-gray-300 leading-relaxed", className)}>
            {children}
        </div>
    );
}

interface GlassCardFooterProps {
    children: ReactNode;
    className?: string;
}

export function GlassCardFooter({
    children,
    className,
}: GlassCardFooterProps) {
    return (
        <div className={cn("mt-4 pt-4 border-t border-white/10", className)}>
            {children}
        </div>
    );
}
