"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, id, className = "", ...props }, ref) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={[
            "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm",
            "placeholder:text-gray-400",
            "focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/30",
            "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
            error ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "",
            className,
          ].join(" ")}
          {...props}
        />
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : null}
      </div>
    );
  },
);
