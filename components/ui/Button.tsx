"use client";

import { Button as BaseButton } from "@/components/base/buttons/button";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

const variantMap: Record<Variant, any> = {
    primary: "primary",
    secondary: "secondary",
    outline: "secondary",
    ghost: "tertiary",
    destructive: "primary-destructive",
};

export default function Button({
    variant = "primary",
    size = "md",
    disabled,
    ...props
}: {
    variant?: Variant;
    size?: Size;
    disabled?: boolean;
    [key: string]: any;
}) {
    return (
        <BaseButton color={variantMap[variant] || "primary"} size={size} isDisabled={disabled} {...props} />
    );
}
