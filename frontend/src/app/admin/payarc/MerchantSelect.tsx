"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

export type MerchantAccount = {
  merchantName: string;
  merchantId: string; // MID
};

type Props = {
  accounts: MerchantAccount[];
  value: MerchantAccount | null;
  onChange: (acc: MerchantAccount | null) => void;
  loading?: boolean;
  placeholder?: string;
  maxItems?: number; // default 30
};

export default function MerchantSelect({
  accounts,
  value,
  onChange,
  loading = false,
  placeholder = "Search by merchant name or MID…",
  maxItems = 30,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value ? `${value.merchantName} (${value.merchantId})` : "");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Filter by name or MID (case-insensitive)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts.slice(0, maxItems);
    return accounts
      .filter(a => a.merchantName.toLowerCase().includes(q) || a.merchantId.toLowerCase().includes(q))
      .slice(0, maxItems);
  }, [accounts, query, maxItems]);

  // Close on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Keyboard nav
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) selectItem(item);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const selectItem = (acc: MerchantAccount) => {
    onChange(acc);
    setQuery(`${acc.merchantName} (${acc.merchantId})`);
    setOpen(false);
  };

  const clearSelection = () => {
    onChange(null);
    setQuery("");
    setOpen(false);
    setActiveIndex(0);
  };

  return (
    <div ref={rootRef} className="relative">
      <label className="block text-xs font-medium text-slate-500 mb-1">
        Merchant (search by name or MID)
      </label>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-20 text-sm shadow-sm focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
        />

        {/* Right-side controls */}
        <div className="absolute inset-y-0 right-2 flex items-center gap-2">
          {loading && (
            <svg className="h-4 w-4 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8v4A4 4 0 008 12H4z"/>
            </svg>
          )}
          {value && (
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
              title="Clear"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
            title="Toggle"
          >
            ▼
          </button>
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          ref={listRef}
          className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white text-sm shadow-lg"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-slate-500">No matches</div>
          ) : (
            filtered.map((acc, idx) => (
              <button
                key={`${acc.merchantId}-${idx}`}
                type="button"
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => selectItem(acc)}
                className={`flex w-full flex-col items-start px-3 py-2 text-left hover:bg-slate-50 ${
                  idx === activeIndex ? "bg-red-50" : ""
                }`}
              >
                <span className="font-medium text-slate-900">{acc.merchantName}</span>
                <span className="text-xs text-slate-500">{acc.merchantId}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
