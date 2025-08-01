"use client";

import React from "react";

export default function Card({ title, children, className = "" }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 ${className}`}
    >
      {title && (
        <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
          {title}
        </h2>
      )}
      <div className="text-gray-700 dark:text-gray-300">{children}</div>
    </div>
  );
}
