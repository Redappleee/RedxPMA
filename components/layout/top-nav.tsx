"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { useDebounce } from "@/hooks/use-debounce";
import { searchService } from "@/services/search.service";
import { Input } from "@/ui/input";
import { timeAgo } from "@/utils/date";

export const TopNav = ({ onSearch }: { onSearch?: (value: string) => void }) => {
  const router = useRouter();
  const pathname = usePathname();
  const onNotificationsPage = pathname === "/notifications";
  const enableGlobalSearch = !onSearch;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debouncedQuery = useDebounce(query.trim(), 280);

  const { data, isFetching } = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: () => searchService.global(debouncedQuery),
    enabled: enableGlobalSearch && debouncedQuery.length >= 2,
    staleTime: 10_000
  });

  const totalResults = useMemo(() => {
    if (!data) return 0;
    return data.products.length + data.members.length + data.activities.length;
  }, [data]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigate = (target: string) => {
    setOpen(false);
    setQuery("");
    router.push(target as never);
  };

  return (
    <header className="glass sticky top-4 z-30 flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
      <div className="relative w-full max-w-xl" ref={containerRef}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products, people, activities..."
          className="border-0 bg-muted pl-9"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch?.(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
            }

            if (!enableGlobalSearch || e.key !== "Enter") {
              return;
            }

            if (data?.products[0]?._id) {
              navigate(`/products/${data.products[0]._id}`);
              return;
            }

            navigate(`/products${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ""}`);
          }}
        />

        {enableGlobalSearch && open && query.trim().length >= 2 && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[420px] overflow-auto rounded-2xl border border-border bg-card p-2 shadow-xl">
            {isFetching ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">Searching...</p>
            ) : totalResults === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">No matches found.</p>
            ) : (
              <div className="space-y-2">
                {data?.products.length ? (
                  <div>
                    <p className="px-2 py-1 text-xs uppercase tracking-[0.1em] text-muted-foreground">Products</p>
                    <div className="space-y-1">
                      {data.products.map((product) => (
                        <button
                          key={product._id}
                          type="button"
                          onClick={() => navigate(`/products/${product._id}`)}
                          className="w-full rounded-lg px-2 py-2 text-left hover:bg-muted"
                        >
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.category} • {product.status} • ${product.price.toLocaleString("en-US")}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {data?.members.length ? (
                  <div>
                    <p className="px-2 py-1 text-xs uppercase tracking-[0.1em] text-muted-foreground">Team</p>
                    <div className="space-y-1">
                      {data.members.map((member) => (
                        <button
                          key={member._id}
                          type="button"
                          onClick={() => navigate("/team")}
                          className="w-full rounded-lg px-2 py-2 text-left hover:bg-muted"
                        >
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.email} • {member.role}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {data?.activities.length ? (
                  <div>
                    <p className="px-2 py-1 text-xs uppercase tracking-[0.1em] text-muted-foreground">Activities</p>
                    <div className="space-y-1">
                      {data.activities.map((activity) => (
                        <button
                          key={activity._id}
                          type="button"
                          onClick={() => {
                            if (activity.entityType === "product" && activity.entityId) {
                              navigate(`/products/${activity.entityId}`);
                              return;
                            }

                            if (activity.entityType === "team") {
                              navigate("/team");
                              return;
                            }

                            navigate("/dashboard");
                          }}
                          className="w-full rounded-lg px-2 py-2 text-left hover:bg-muted"
                        >
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.user?.name ?? "Unknown"} • {timeAgo(activity.createdAt)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Link
          href="/notifications"
          className={`relative rounded-xl p-2 transition-colors ${
            onNotificationsPage ? "bg-muted" : "hover:bg-muted"
          }`}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {!onNotificationsPage && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />}
        </Link>
        <UserMenu />
      </div>
    </header>
  );
};
