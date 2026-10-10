/** Small fetch wrapper for client components: throws a readable Error on non-2xx responses. */
export async function apiRequest<T = unknown>(url: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(url, {
    method: init.method ?? (init.body === undefined ? "GET" : "POST"),
    headers: init.body === undefined ? undefined : { "content-type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const details = data?.details && typeof data.details === "object" ? data.details : null;
    const fieldErrors = details?.fieldErrors ? Object.values(details.fieldErrors).flat().join(" ") : "";
    throw new Error(fieldErrors || data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}
