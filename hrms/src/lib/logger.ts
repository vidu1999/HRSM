type Level = "debug" | "info" | "warn" | "error";

// Minimal structured (JSON) logger. Swap for pino if the project grows.
function write(level: Level, obj: Record<string, unknown> | string, msg?: string) {
  const payload =
    typeof obj === "string"
      ? { level, time: new Date().toISOString(), msg: obj }
      : { level, time: new Date().toISOString(), msg, ...serializeErrors(obj) };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else console.log(line);
}

function serializeErrors(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v instanceof Error ? { name: v.name, message: v.message, stack: v.stack } : v;
  }
  return out;
}

export const logger = {
  debug: (obj: Record<string, unknown> | string, msg?: string) => write("debug", obj, msg),
  info: (obj: Record<string, unknown> | string, msg?: string) => write("info", obj, msg),
  warn: (obj: Record<string, unknown> | string, msg?: string) => write("warn", obj, msg),
  error: (obj: Record<string, unknown> | string, msg?: string) => write("error", obj, msg),
};
