import { cn } from "@/lib/utils";

interface SettingsToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export const SettingsToggle = ({
  label,
  description,
  checked,
  onChange,
  disabled
}: SettingsToggleProps) => {
  return (
    <label
      className={cn(
        "flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3",
        disabled && "opacity-60"
      )}
    >
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-blue-500"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
};
