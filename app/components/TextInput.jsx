"use client";
import React, { forwardRef } from "react";

const TextInput = forwardRef(function TextInput(
  {
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    className = "",
    icon,
    rightIcon,
    onRightIconClick,
    ...props
  },
  ref
) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            icon ? "pl-10" : ""
          } ${rightIcon ? "pr-10" : ""} ${className}`}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            tabIndex={-1}
          >
            {rightIcon}
          </button>
        )}
      </div>
    </div>
  );
});

export default TextInput;
