// components/UI/IconButton.js
"use client";

import clsx from "clsx";

/**
 * IconButton (HeroIcons)
 *
 * Usage:
 * import { ArrowLeftIcon } from "@heroicons/react/24/outline";
 * import { TrashIcon } from "@heroicons/react/24/solid";
 *
 * <IconButton icon={ArrowLeftIcon} label="Back" onClick={onClose} />
 * <IconButton icon={TrashIcon} variant="danger" label="Delete" />
 */

const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
};

const iconSizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
};

const variantClasses = {
    primary:
        "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
    secondary:
        "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
    ghost:
        "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
    danger:
        "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
};

export default function IconButton({
    icon: Icon,
    label,
    size = "md",
    variant = "ghost",
    className,
    disabled,
    onClick,
    ...props
}) {
    return (
        <button
            type="button"
            aria-label={label}
            disabled={disabled}
            className={clsx(
                "inline-flex items-center justify-center rounded-xl transition focus:outline-none focus:ring-2 focus:ring-offset-2",
                sizeClasses[size],
                variantClasses[variant],
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
            onClick={onClick}
            {...props}
        >
            <Icon className={iconSizeClasses[size]} aria-hidden="true" />
        </button>
    );
}
