"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CreditCard, LogOut, Shield, SlidersHorizontal, User2, Users, Workflow } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { TopNav } from "@/components/layout/top-nav";
import { SettingsToggle } from "@/components/settings/settings-toggle";
import { authService } from "@/services/auth.service";
import { settingsService } from "@/services/settings.service";
import { useAuthStore } from "@/store/auth-store";
import { useSettingsStore } from "@/store/settings-store";
import { AppSettings } from "@/types/settings";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { formatWorkspaceDate } from "@/utils/formatting";

type SettingsTabId =
  | "profile"
  | "workspace"
  | "permissions"
  | "products"
  | "notifications"
  | "security"
  | "appearance"
  | "integrations"
  | "billing";

const SETTINGS_TABS: Array<{ id: SettingsTabId; label: string }> = [
  { id: "profile", label: "Profile" },
  { id: "workspace", label: "Workspace" },
  { id: "permissions", label: "Team Permissions" },
  { id: "products", label: "Product Defaults" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security" },
  { id: "appearance", label: "Appearance" },
  { id: "integrations", label: "Integrations" },
  { id: "billing", label: "Billing" }
];

export default function SettingsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { settings, replaceSettings, lastSavedAt } = useSettingsStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<SettingsTabId>("profile");
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [profileDraft, setProfileDraft] = useState({
    name: currentUser?.name ?? "",
    avatar: currentUser?.avatar ?? ""
  });
  const [sessionDetails, setSessionDetails] = useState({
    device: "Current browser session",
    timezone: settings.workspace.timezone,
    locale: "en-US"
  });
  const [message, setMessage] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const canManageSettings = currentUser?.role === "admin" || currentUser?.role === "manager";

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsService.get(),
    enabled: Boolean(currentUser),
    staleTime: 60_000
  });

  useEffect(() => {
    if (!settingsQuery.data || initialized) return;
    replaceSettings(settingsQuery.data.settings, settingsQuery.data.updatedAt);
    setInitialized(true);
  }, [initialized, replaceSettings, settingsQuery.data]);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    setProfileDraft({
      name: currentUser?.name ?? "",
      avatar: currentUser?.avatar ?? ""
    });
  }, [currentUser?.avatar, currentUser?.name]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setSessionDetails({
      device: `${navigator.platform || "Unknown device"} · ${navigator.userAgent.includes("Chrome") ? "Chrome" : "Browser"}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || settings.workspace.timezone,
      locale: navigator.language || "en-US"
    });
  }, [settings.workspace.timezone]);

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings), [draft, settings]);
  const isProfileDirty =
    profileDraft.name.trim() !== (currentUser?.name ?? "") || (profileDraft.avatar || "") !== (currentUser?.avatar || "");

  const saveMutation = useMutation({
    mutationFn: (nextSettings: AppSettings) => settingsService.update(nextSettings),
    onSuccess: (data) => {
      replaceSettings(data.settings, data.updatedAt);
      setDraft(data.settings);
      queryClient.setQueryData(["settings"], data);
      setMessage(data.message ?? "Settings saved.");
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Failed to save settings");
    }
  });

  const resetMutation = useMutation({
    mutationFn: () => settingsService.reset(),
    onSuccess: (data) => {
      replaceSettings(data.settings, data.updatedAt);
      setDraft(data.settings);
      queryClient.setQueryData(["settings"], data);
      setMessage(data.message ?? "Settings reset to defaults.");
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Failed to reset settings");
    }
  });

  const profileMutation = useMutation({
    mutationFn: () =>
      authService.updateProfile({
        name: profileDraft.name.trim(),
        avatar: profileDraft.avatar.trim() || undefined
      }),
    onSuccess: async (user) => {
      setAuth(user, token);
      await queryClient.invalidateQueries({ queryKey: ["team"] });
      setMessage("Profile updated.");
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Failed to update profile");
    }
  });

  const saveChanges = () => {
    if (!canManageSettings) {
      setMessage("Only admin or manager can update settings.");
      return;
    }
    saveMutation.mutate(draft);
  };

  const resetAll = () => {
    if (!canManageSettings) {
      setMessage("Only admin or manager can update settings.");
      return;
    }
    resetMutation.mutate();
  };

  const logoutCurrentSession = async () => {
    await authService.logout().catch(() => undefined);
    clearAuth();
    window.location.href = "/login";
  };

  const setSection = <K extends keyof AppSettings>(key: K, patch: Partial<AppSettings[K]>) => {
    setDraft((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...patch
      }
    }));
  };

  const renderTab = () => {
    if (activeTab === "profile") {
      return (
        <Card className="p-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User2 className="h-4 w-4" />
              Profile settings
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Full name</Label>
              <Input
                value={profileDraft.name}
                onChange={(event) => setProfileDraft((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={currentUser?.email ?? ""} disabled />
            </div>
            <div>
              <Label>Role</Label>
              <div className="h-10 rounded-xl border border-border bg-muted px-3 py-2 text-sm">
                {currentUser?.role ?? "member"}
              </div>
            </div>
            <div>
              <Label>Avatar URL</Label>
              <Input
                value={profileDraft.avatar}
                onChange={(event) => setProfileDraft((prev) => ({ ...prev, avatar: event.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-border bg-card p-3">
              <div>
                <p className="text-sm font-medium">Profile persistence</p>
                <p className="text-xs text-muted-foreground">
                  Your name and avatar update immediately across team, comments, and header UI.
                </p>
              </div>
              <Button disabled={!isProfileDirty || profileMutation.isPending} onClick={() => profileMutation.mutate()}>
                {profileMutation.isPending ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (activeTab === "workspace") {
      return (
        <Card className="p-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Workspace settings
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Company name</Label>
              <Input
                value={draft.workspace.companyName}
                onChange={(e) => setSection("workspace", { companyName: e.target.value })}
              />
            </div>
            <div>
              <Label>Workspace logo URL</Label>
              <Input
                value={draft.workspace.logoUrl}
                placeholder="https://..."
                onChange={(e) => setSection("workspace", { logoUrl: e.target.value })}
              />
            </div>
            <div>
              <Label>Timezone</Label>
              <Input
                value={draft.workspace.timezone}
                onChange={(e) => setSection("workspace", { timezone: e.target.value })}
              />
            </div>
            <div>
              <Label>Currency</Label>
              <select
                className="h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm"
                value={draft.workspace.currency}
                onChange={(e) => setSection("workspace", { currency: e.target.value as AppSettings["workspace"]["currency"] })}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div>
              <Label>Date format</Label>
              <select
                className="h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm"
                value={draft.workspace.dateFormat}
                onChange={(e) =>
                  setSection("workspace", { dateFormat: e.target.value as AppSettings["workspace"]["dateFormat"] })
                }
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (activeTab === "permissions") {
      return (
        <Card className="p-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Default invite role</Label>
              <select
                className="mt-1 h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm"
                value={draft.teamPermissions.defaultInviteRole}
                onChange={(e) =>
                  setSection("teamPermissions", {
                    defaultInviteRole: e.target.value as AppSettings["teamPermissions"]["defaultInviteRole"]
                  })
                }
              >
                <option value="member">Member</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            <SettingsToggle
              label="Allow members to invite"
              description="When enabled, members can invite other members."
              checked={draft.teamPermissions.membersCanInvite}
              onChange={(value) => setSection("teamPermissions", { membersCanInvite: value })}
            />
            <SettingsToggle
              label="Allow members to delete comments"
              description="Permit members to remove product comments from collaboration threads."
              checked={draft.teamPermissions.membersCanDeleteComments}
              onChange={(value) => setSection("teamPermissions", { membersCanDeleteComments: value })}
            />
          </CardContent>
        </Card>
      );
    }

    if (activeTab === "products") {
      return (
        <Card className="p-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              Product defaults
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Default product status</Label>
              <select
                className="mt-1 h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm"
                value={draft.productDefaults.defaultStatus}
                onChange={(e) =>
                  setSection("productDefaults", {
                    defaultStatus: e.target.value as AppSettings["productDefaults"]["defaultStatus"]
                  })
                }
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <Label>Default category</Label>
              <Input
                value={draft.productDefaults.defaultCategory}
                onChange={(e) => setSection("productDefaults", { defaultCategory: e.target.value })}
              />
            </div>
            <div>
              <Label>Tax rate (%)</Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={draft.productDefaults.taxRate}
                onChange={(e) => setSection("productDefaults", { taxRate: Number(e.target.value || 0) })}
              />
            </div>
            <div>
              <Label>Low stock threshold</Label>
              <Input
                type="number"
                min={0}
                value={draft.productDefaults.lowStockThreshold}
                onChange={(e) => setSection("productDefaults", { lowStockThreshold: Number(e.target.value || 0) })}
              />
            </div>
            <div>
              <Label>Auto archive inactive products (days)</Label>
              <Input
                type="number"
                min={30}
                value={draft.productDefaults.autoArchiveDays}
                onChange={(e) => setSection("productDefaults", { autoArchiveDays: Number(e.target.value || 30) })}
              />
            </div>
          </CardContent>
        </Card>
      );
    }

    if (activeTab === "notifications") {
      return (
        <Card className="p-1">
          <CardHeader>
            <CardTitle>Notification preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingsToggle
              label="Email digest"
              description="Send a daily digest email summary."
              checked={draft.notifications.emailDigest}
              onChange={(value) => setSection("notifications", { emailDigest: value })}
            />
            <SettingsToggle
              label="Product updates"
              description="In-app notifications for product create/update/delete events."
              checked={draft.notifications.productUpdates}
              onChange={(value) => setSection("notifications", { productUpdates: value })}
            />
            <SettingsToggle
              label="Comment mentions"
              description="Notify when someone mentions you in comments."
              checked={draft.notifications.commentMentions}
              onChange={(value) => setSection("notifications", { commentMentions: value })}
            />
            <SettingsToggle
              label="Invite alerts"
              description="Receive alerts for team invites and permission changes."
              checked={draft.notifications.inviteAlerts}
              onChange={(value) => setSection("notifications", { inviteAlerts: value })}
            />
            <SettingsToggle
              label="Billing alerts"
              description="Get notified about invoices and payment issues."
              checked={draft.notifications.billingAlerts}
              onChange={(value) => setSection("notifications", { billingAlerts: value })}
            />
          </CardContent>
        </Card>
      );
    }

    if (activeTab === "security") {
      return (
        <div className="space-y-4">
          <Card className="p-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SettingsToggle
                label="Two-factor authentication"
                description="Require a second factor during sign-in."
                checked={draft.security.twoFactorEnabled}
                onChange={(value) => setSection("security", { twoFactorEnabled: value })}
              />
              <SettingsToggle
                label="Login alerts"
                description="Receive alerts for new device sign-ins."
                checked={draft.security.loginAlerts}
                onChange={(value) => setSection("security", { loginAlerts: value })}
              />
              <div>
                <Label>Session timeout (minutes)</Label>
                <Input
                  type="number"
                  min={15}
                  value={draft.security.sessionTimeoutMinutes}
                  onChange={(e) => setSection("security", { sessionTimeoutMinutes: Number(e.target.value || 15) })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="p-1">
            <CardHeader>
              <CardTitle>Active sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div>
                  <p className="text-sm font-medium">{sessionDetails.device}</p>
                  <p className="text-xs text-muted-foreground">
                    {sessionDetails.timezone} · {sessionDetails.locale}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Idle logout after {draft.security.sessionTimeoutMinutes} minutes of inactivity.
                  </p>
                </div>
                <Badge variant="success">Current</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={logoutCurrentSession}>
                <LogOut className="h-4 w-4" />
                Log out current session
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeTab === "appearance") {
      return (
        <Card className="p-1">
          <CardHeader>
            <CardTitle>Appearance settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingsToggle
              label="Compact mode"
              description="Reduce spacing density across the workspace."
              checked={draft.appearance.compactMode}
              onChange={(value) => setSection("appearance", { compactMode: value })}
            />
            <SettingsToggle
              label="Reduce motion"
              description="Minimize animations and motion transitions."
              checked={draft.appearance.reduceMotion}
              onChange={(value) => setSection("appearance", { reduceMotion: value })}
            />
            <div>
              <Label>Accent color</Label>
              <select
                className="mt-1 h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm"
                value={draft.appearance.accentColor}
                onChange={(e) =>
                  setSection("appearance", {
                    accentColor: e.target.value as AppSettings["appearance"]["accentColor"]
                  })
                }
              >
                <option value="blue">Blue</option>
                <option value="emerald">Emerald</option>
                <option value="orange">Orange</option>
              </select>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (activeTab === "integrations") {
      return (
        <Card className="p-1">
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { key: "slackConnected", label: "Slack" },
              { key: "jiraConnected", label: "Jira" },
              { key: "notionConnected", label: "Notion" },
              { key: "githubConnected", label: "GitHub" }
            ].map((integration) => {
              const connected =
                draft.integrations[integration.key as keyof AppSettings["integrations"]];

              return (
                <div
                  key={integration.key}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{integration.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {connected ? "Connected" : "Not connected"}
                    </p>
                  </div>
                  <Button
                    variant={connected ? "outline" : "secondary"}
                    size="sm"
                    onClick={() =>
                      setSection("integrations", {
                        [integration.key]: !connected
                      } as Partial<AppSettings["integrations"]>)
                    }
                  >
                    {connected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="p-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing and plan
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Current plan</Label>
            <select
              className="h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm"
              value={draft.billing.plan}
              onChange={(e) =>
                setSection("billing", { plan: e.target.value as AppSettings["billing"]["plan"] })
              }
            >
              <option value="Starter">Starter</option>
              <option value="Growth">Growth</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <Label>Seat limit</Label>
            <Input
              type="number"
              min={1}
              value={draft.billing.seats}
              onChange={(e) => setSection("billing", { seats: Number(e.target.value || 1) })}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Invoice email</Label>
            <Input
              value={draft.billing.invoiceEmail}
              onChange={(e) => setSection("billing", { invoiceEmail: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <section className="space-y-4">
      <TopNav />

      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure your workspace, security policies, defaults, and integrations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={resetAll}
            disabled={!canManageSettings || resetMutation.isPending || saveMutation.isPending}
          >
            Reset defaults
          </Button>
          <Button
            onClick={saveChanges}
            disabled={!canManageSettings || !isDirty || saveMutation.isPending || resetMutation.isPending}
          >
            Save changes
          </Button>
        </div>
      </div>

      {settingsQuery.error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {settingsQuery.error instanceof Error ? settingsQuery.error.message : "Failed to load settings."}
        </div>
      )}

      {(message || lastSavedAt) && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {message && <span className="rounded-xl bg-muted px-3 py-1.5">{message}</span>}
          {lastSavedAt && (
            <span>
              Last saved:{" "}
              {formatWorkspaceDate(lastSavedAt, settings.workspace.dateFormat, settings.workspace.timezone, {
                includeTime: true
              })}
            </span>
          )}
        </div>
      )}

      {!canManageSettings && (
        <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          View-only mode: only admins and managers can update workspace settings.
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
        <Card className="h-fit p-2">
          <CardContent className="space-y-1 p-0">
            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                  activeTab === tab.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </CardContent>
        </Card>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {renderTab()}
        </motion.div>
      </div>
    </section>
  );
}
