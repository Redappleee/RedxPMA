import { IActivity } from "@/types";
import { timeAgo } from "@/utils/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";

export const ActivityFeed = ({ items }: { items: IActivity[] }) => {
  return (
    <Card className="p-1">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
        {items.map((item) => (
          <div key={item._id} className="rounded-xl border border-border/70 bg-card/70 p-3">
            <p className="text-sm font-medium">{item.action}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              by {item.user?.name ?? "Unknown"} • {timeAgo(item.createdAt)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
