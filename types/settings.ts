export type InviteDefaultRole = "manager" | "member";

export interface AppSettings {
  workspace: {
    companyName: string;
    logoUrl: string;
    timezone: string;
    currency: "USD" | "EUR" | "GBP";
    dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  };
  teamPermissions: {
    defaultInviteRole: InviteDefaultRole;
    membersCanInvite: boolean;
    membersCanDeleteComments: boolean;
  };
  productDefaults: {
    defaultStatus: "active" | "draft" | "archived";
    defaultCategory: string;
    taxRate: number;
    lowStockThreshold: number;
    autoArchiveDays: number;
  };
  notifications: {
    emailDigest: boolean;
    productUpdates: boolean;
    commentMentions: boolean;
    inviteAlerts: boolean;
    billingAlerts: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    loginAlerts: boolean;
    sessionTimeoutMinutes: number;
  };
  appearance: {
    compactMode: boolean;
    reduceMotion: boolean;
    accentColor: "blue" | "emerald" | "orange";
  };
  integrations: {
    slackConnected: boolean;
    jiraConnected: boolean;
    notionConnected: boolean;
    githubConnected: boolean;
  };
  billing: {
    plan: "Starter" | "Growth" | "Enterprise";
    seats: number;
    invoiceEmail: string;
  };
}

export const defaultSettings: AppSettings = {
  workspace: {
    companyName: "Nexus Labs",
    logoUrl: "",
    timezone: "America/New_York",
    currency: "USD",
    dateFormat: "MM/DD/YYYY"
  },
  teamPermissions: {
    defaultInviteRole: "member",
    membersCanInvite: false,
    membersCanDeleteComments: false
  },
  productDefaults: {
    defaultStatus: "draft",
    defaultCategory: "SaaS",
    taxRate: 0,
    lowStockThreshold: 20,
    autoArchiveDays: 120
  },
  notifications: {
    emailDigest: true,
    productUpdates: true,
    commentMentions: true,
    inviteAlerts: true,
    billingAlerts: true
  },
  security: {
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeoutMinutes: 60
  },
  appearance: {
    compactMode: false,
    reduceMotion: false,
    accentColor: "blue"
  },
  integrations: {
    slackConnected: false,
    jiraConnected: false,
    notionConnected: false,
    githubConnected: false
  },
  billing: {
    plan: "Growth",
    seats: 12,
    invoiceEmail: "finance@nexuspm.com"
  }
};
