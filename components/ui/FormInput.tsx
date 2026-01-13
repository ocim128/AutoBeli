"use client";

import { forwardRef, useState, useCallback, InputHTMLAttributes, memo, useId } from "react";
import { cn } from "@/lib/utils";

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  /** Label for the input */
  label?: string;
  /** Helper text shown below the input */
  helperText?: string;
  /** Error message to display */
  error?: string;
  /** Icon to display on the left side */
  icon?: React.ReactNode;
  /** Custom onChange handler that receives the value directly */
  onChange?: (value: string) => void;
  /** Validate function that returns error message or undefined */
  validate?: (value: string) => string | undefined;
  /** Whether to validate on blur instead of on change */
  validateOnBlur?: boolean;
  /** Success state indicator */
  success?: boolean;
}

/**
 * Enhanced form input with real-time validation feedback.
 * Features: validation states, shimmer animation on focus, accessible labels.
 */
const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      helperText,
      error: externalError,
      icon,
      onChange,
      validate,
      validateOnBlur = false,
      success,
      className,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const [internalError, setInternalError] = useState<string | undefined>();
    const [isFocused, setIsFocused] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    const generatedId = useId();
    const error = externalError || internalError;
    const inputId = id || `input-${generatedId}`;

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onChange?.(value);

        if (!hasInteracted) {
          setHasInteracted(true);
        }

        // Real-time validation (if not validateOnBlur)
        if (validate && !validateOnBlur) {
          const validationError = validate(value);
          setInternalError(validationError);
        }
      },
      [onChange, validate, validateOnBlur, hasInteracted]
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);

        // Validate on blur if configured
        if (validate && validateOnBlur) {
          const validationError = validate(e.target.value);
          setInternalError(validationError);
        }
      },
      [validate, validateOnBlur]
    );

    const handleFocus = useCallback(() => {
      setIsFocused(true);
    }, []);

    // Determine visual state
    const hasError = !!error && hasInteracted;
    const hasSuccess = success && !hasError && hasInteracted;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-3 pl-1"
          >
            {label}
          </label>
        )}

        <div className="relative group">
          {/* Icon */}
          {icon && (
            <div
              className={cn(
                "absolute left-5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none",
                hasError
                  ? "text-red-400"
                  : hasSuccess
                    ? "text-green-500"
                    : isFocused
                      ? "text-indigo-600"
                      : "text-gray-400"
              )}
            >
              {icon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            className={cn(
              "w-full py-5 bg-gray-50 border-2 rounded-[1.5rem] focus:ring-4 focus:bg-white transition-all text-lg font-bold text-gray-900 placeholder:text-gray-300",
              icon ? "pl-14 pr-6" : "px-6",
              hasError
                ? "border-red-200 focus:border-red-400 focus:ring-red-500/10"
                : hasSuccess
                  ? "border-green-200 focus:border-green-400 focus:ring-green-500/10"
                  : "border-gray-100 focus:border-indigo-600 focus:ring-indigo-500/10",
              disabled && "opacity-60 cursor-not-allowed",
              className
            )}
            {...props}
          />

          {/* Success indicator */}
          {hasSuccess && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-green-500 animate-scale-in">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}

          {/* Focus ring animation */}
          <div
            className={cn(
              "absolute inset-0 rounded-[1.5rem] pointer-events-none transition-opacity duration-300",
              isFocused ? "opacity-100" : "opacity-0"
            )}
          >
            <div
              className="absolute -inset-1 rounded-[1.75rem] border animate-orbit-fast opacity-20"
              style={{
                borderColor: hasError ? "#fca5a5" : hasSuccess ? "#86efac" : "#6366f1",
                transformOrigin: "center",
              }}
            />
          </div>
        </div>

        {/* Error message */}
        {hasError && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-red-500 font-medium mt-2 pl-1 flex items-center gap-1 animate-slide-up"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {/* Helper text */}
        {helperText && !hasError && (
          <p id={`${inputId}-helper`} className="text-xs text-gray-400 font-medium mt-4 pl-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

export default memo(FormInput);
