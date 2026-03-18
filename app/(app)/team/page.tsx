"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { TopNav } from "@/components/layout/top-nav";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";
import { settingsService } from "@/services/settings.service";
import { teamService } from "@/services/team.service";
import { useAuthStore } from "@/store/auth-store";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";

export default function TeamPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === "admin";
  const [message, setMessage] = useState<string | null>(null);
  const [draftRoles, setDraftRoles] = useState<Record<string, "admin" | "manager" | "member">>({});

  const { data } = useQuery({
    queryKey: ["team"],
    queryFn: teamService.list
  });
  const { data: settingsData } = useQuery({
    queryKey: ["settings", "team-page"],
    queryFn: settingsService.get
  });

  const canInvite =
    currentUser?.role === "admin" ||
    currentUser?.role === "manager" ||
    (currentUser?.role === "member" && settingsData?.settings.teamPermissions.membersCanInvite);
  const seatLimit = settingsData?.settings.billing.seats ?? 0;
  const seatCount = data?.length ?? 0;
  const seatsRemaining = Math.max(0, seatLimit - seatCount);
  const allowedInviteRoles: Array<"manager" | "member"> =
    currentUser?.role === "admin" || currentUser?.role === "manager" ? ["manager", "member"] : ["member"];

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: "admin" | "manager" | "member" }) => teamService.updateRole(id, role),
    onSuccess: async () => {
      setMessage("Role updated.");
      await queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (error) => {
      setMessage(error.message);
    }
  });
  const deleteMemberMutation = useMutation({
    mutationFn: (id: string) => teamService.remove(id),
    onSuccess: async () => {
      setMessage("Team member deleted.");
      await queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (error) => {
      setMessage(error.message);
    }
  });

  const getDraftRole = (id: string, currentRole: "admin" | "manager" | "member") =>
    draftRoles[id] ?? currentRole;

  const onSaveRole = (id: string, currentRole: "admin" | "manager" | "member") => {
    const nextRole = getDraftRole(id, currentRole);
    if (nextRole === currentRole) return;
    updateRoleMutation.mutate({ id, role: nextRole });
  };

  const onDeleteMember = (id: string, name: string) => {
    const confirmed = window.confirm(`Delete ${name} from the workspace? This action cannot be undone.`);
    if (!confirmed) return;
    deleteMemberMutation.mutate(id);
  };

  return (
    <section className="space-y-4">
      <TopNav />

      <div className="glass flex items-center justify-between rounded-2xl p-4">
        <div>
          <h1 className="text-2xl font-semibold">Team management</h1>
          <p className="text-sm text-muted-foreground">
            Invite and manage workspace collaborators. {seatLimit > 0 ? `${seatCount}/${seatLimit} seats used.` : ""}
          </p>
        </div>
        {canInvite ? (
          <InviteMemberDialog
            allowedRoles={allowedInviteRoles}
            defaultRole={settingsData?.settings.teamPermissions.defaultInviteRole ?? "member"}
            disabled={seatLimit > 0 && seatsRemaining <= 0}
          />
        ) : (
          <p className="text-xs text-muted-foreground">Invites are disabled for your role under current workspace settings.</p>
        )}
      </div>
      {seatLimit > 0 && seatsRemaining <= 0 && (
        <p className="rounded-xl bg-warning/10 px-3 py-2 text-sm text-warning">All seats are currently used. Increase seat limit in Settings to invite more members.</p>
      )}
      {message && <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">{message}</p>}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(data ?? []).map((member) => (
          <Card key={member._id} className="p-5">
            <CardContent className="p-0">
              <p className="font-semibold">{member.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{member.email}</p>
              <Badge className="mt-3" variant={member.role === "admin" ? "info" : member.role === "manager" ? "success" : "neutral"}>
                {member.role}
              </Badge>
              {isAdmin && (
                <div className="mt-4 space-y-2">
                  <select
                    className="h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm"
                    value={getDraftRole(member._id, member.role)}
                    onChange={(event) =>
                      setDraftRoles((state) => ({
                        ...state,
                        [member._id]: event.target.value as "admin" | "manager" | "member"
                      }))
                    }
                    disabled={updateRoleMutation.isPending}
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="member">Member</option>
                  </select>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    disabled={
                      updateRoleMutation.isPending ||
                      member._id === currentUser?._id ||
                      getDraftRole(member._id, member.role) === member.role
                    }
                    onClick={() => onSaveRole(member._id, member.role)}
                  >
                    {updateRoleMutation.isPending ? "Saving..." : "Update role"}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    className="w-full"
                    disabled={deleteMemberMutation.isPending || member._id === currentUser?._id}
                    onClick={() => onDeleteMember(member._id, member.name)}
                  >
                    {deleteMemberMutation.isPending ? "Deleting..." : "Delete member"}
                  </Button>
                  {member._id === currentUser?._id && (
                    <p className="text-xs text-muted-foreground">Your own role cannot be downgraded.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
