export const formatTime = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    Math.ceil((d.getTime() - Date.now()) / (1000 * 60)),
    "minute"
  );
};

export const profileformatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function formatDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return "Unknown";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const formatTimeAgo = (dateInput: string | Date): string => {
  const now = new Date();
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d`;
};
