import { AppSettings } from "@/types/settings";

type CurrencyCode = AppSettings["workspace"]["currency"];
type DateFormat = AppSettings["workspace"]["dateFormat"];

const getDateParts = (value: string | Date, timeZone?: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((accumulator, part) => {
    if (part.type !== "literal") {
      accumulator[part.type] = part.value;
    }
    return accumulator;
  }, {});

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute
  };
};

export const formatCurrency = (value: number, currency: CurrencyCode) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);

export const formatWorkspaceDate = (
  value: string | Date,
  dateFormat: DateFormat,
  timeZone?: string,
  options?: { includeTime?: boolean }
) => {
  const parts = getDateParts(value, timeZone);

  if (!parts) {
    return "-";
  }

  const dateLabel =
    dateFormat === "DD/MM/YYYY"
      ? `${parts.day}/${parts.month}/${parts.year}`
      : dateFormat === "YYYY-MM-DD"
        ? `${parts.year}-${parts.month}-${parts.day}`
        : `${parts.month}/${parts.day}/${parts.year}`;

  if (!options?.includeTime) {
    return dateLabel;
  }

  return `${dateLabel} ${parts.hour}:${parts.minute}`;
};
