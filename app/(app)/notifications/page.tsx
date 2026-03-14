"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, CircleAlert } from "lucide-react";

import { TopNav } from "@/components/layout/top-nav";
import { useRealtime } from "@/hooks/use-realtime";
import { notificationService } from "@/services/notification.service";
import { useAuthStore } from "@/store/auth-store";
import { INotification } from "@/types";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Skeleton } from "@/ui/skeleton";
import { timeAgo } from "@/utils/date";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?._id);

  const { data, isLoading, isError, error } = useQuery<INotification[]>({
    queryKey: ["notifications"],
    queryFn: notificationService.list
  });

  const readMutation = useMutation({
    mutationFn: notificationService.markRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  useRealtime(
    "notification:new",
    () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    userId
  );

  return (
    <section className="space-y-4">
      <TopNav />
      <h1 className="text-2xl font-semibold">Notifications</h1>

      {isError && (
        <Card className="border border-danger/40 p-4">
          <CardContent className="flex items-center gap-2 p-0 text-sm text-danger">
            <CircleAlert className="h-4 w-4" />
            {error instanceof Error ? error.message : "Failed to load notifications."}
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      )}

      {!isLoading && !isError && (data ?? []).length === 0 && (
        <Card className="p-8">
          <CardContent className="flex flex-col items-center justify-center gap-2 p-0 text-center">
            <BellRing className="h-6 w-6 text-muted-foreground" />
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm text-muted-foreground">
              Product updates, mentions, and invites will appear here.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {(data ?? []).map((notification) => (
          <Card key={notification._id} className="p-4">
            <CardContent className="flex items-center justify-between gap-3 p-0">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{notification.title}</p>
                  <Badge variant={notification.isRead ? "neutral" : "info"}>
                    {notification.isRead ? "Read" : "New"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{notification.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">{timeAgo(notification.createdAt)}</p>
              </div>
              {!notification.isRead && (
                <Button variant="secondary" size="sm" onClick={() => readMutation.mutate(notification._id)}>
                  Mark read
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
