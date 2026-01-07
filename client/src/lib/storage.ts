// Frontend storage helper for uploading files to S3
// Uses the frontend forge API endpoint

const FORGE_API_URL = import.meta.env.VITE_FRONTEND_FORGE_API_URL;
const FORGE_API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

export async function storagePut(
  relKey: string,
  data: Blob | File,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (!FORGE_API_URL || !FORGE_API_KEY) {
    throw new Error("Storage configuration missing");
  }

  const baseUrl = ensureTrailingSlash(FORGE_API_URL);
  const key = normalizeKey(relKey);
  
  const uploadUrl = new URL("v1/storage/upload", baseUrl);
  uploadUrl.searchParams.set("path", key);

  const formData = new FormData();
  const blob = data instanceof File ? data : new Blob([data], { type: contentType });
  formData.append("file", blob, key.split("/").pop() ?? key);

  const response = await fetch(uploadUrl.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FORGE_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Storage upload failed: ${message}`);
  }

  const result = await response.json();
  return { key, url: result.url };
}
