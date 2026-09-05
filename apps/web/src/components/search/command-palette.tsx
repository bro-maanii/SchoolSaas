"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, ArrowRight, Users, GraduationCap, BookOpen } from "lucide-react";
import * as searchApi from "@/lib/api/search";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/cn";
import type { SearchResultCategory } from "@/types/search";

const CATEGORY_ICON: Record<SearchResultCategory, typeof Users> = {
  Student: Users,
  Class: GraduationCap,
  Training: BookOpen,
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function CommandPalette() {
  const router = useRouter();
  const open = useUIStore((s) => s.commandPaletteOpen);
  const close = useUIStore((s) => s.closeCommandPalette);
  const openPalette = useUIStore((s) => s.openCommandPalette);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebouncedValue(query, 250);

  const { data: results, isFetching } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchApi.search(debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
  });

  const flatResults = useMemo(() => results ?? [], [results]);

  // Reset the query/selection the moment `open` flips true, and re-clamp the
  // selection whenever the result set changes size — both done during render
  // (React's documented "adjust state while rendering" pattern) rather than
  // in an effect, since they're plain derived resets, not a sync with an
  // external system.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }
  const [prevResultsLength, setPrevResultsLength] = useState(flatResults.length);
  if (flatResults.length !== prevResultsLength) {
    setPrevResultsLength(flatResults.length);
    setActiveIndex(0);
  }

  // Global Cmd/Ctrl+K opens the palette from anywhere.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPalette();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openPalette]);

  // The actual side effect — focusing the DOM input — stays in an effect.
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  function navigateTo(href: string) {
    close();
    router.push(href);
  }

  function handleKeyDown(e: ReactKeyboardEvent) {
    if (e.key === "Escape") {
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const picked = flatResults[activeIndex];
      if (picked) navigateTo(picked.href);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-gray-900/40 px-4 pt-[12vh] animate-fade-in" onClick={close}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-surface-border px-4">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search students, classes, training…"
            className="h-12 w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          {isFetching && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-400" />}
          <kbd className="hidden shrink-0 rounded border border-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 sm:block">
            Esc
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {debouncedQuery.trim().length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-gray-400">
              Start typing to search across students, classes, and training articles.
            </p>
          )}

          {debouncedQuery.trim().length > 0 && !isFetching && flatResults.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-gray-400">No results for &ldquo;{debouncedQuery}&rdquo;.</p>
          )}

          {flatResults.map((result, index) => {
            const Icon = CATEGORY_ICON[result.category];
            const isActive = index === activeIndex;
            return (
              <button
                key={`${result.category}-${result.id}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => navigateTo(result.href)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                  isActive ? "bg-primary-50" : "hover:bg-gray-50"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    isActive ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-900">{result.label}</span>
                  <span className="block truncate text-xs text-gray-500">{result.sublabel}</span>
                </span>
                <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                  {result.category}
                </span>
                {isActive && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary-600" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
