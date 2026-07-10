const SCHEDULE_TIME_ZONE = "America/Sao_Paulo";

export function getSaoPauloDateStart(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SCHEDULE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return new Date(
    Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day))
  );
}

export function addUtcDays(date: Date, days: number) {
  const result = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );

  result.setUTCDate(result.getUTCDate() + days);

  return result;
}
