import { formatDistanceToNowStrict } from "date-fns";

export const timeAgo = (value: string | Date) =>
  formatDistanceToNowStrict(new Date(value), { addSuffix: true });
