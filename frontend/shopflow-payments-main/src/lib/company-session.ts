const AUTH_KEY = "payflow.company.auth";

function readAuthMap(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeAuthMap(value: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(value));
}

export function isCompanyAuthenticated(companyCode: string) {
  const map = readAuthMap();
  return Boolean(map[companyCode]);
}

export function setCompanyAuthenticated(companyCode: string, authenticated: boolean) {
  const map = readAuthMap();
  map[companyCode] = authenticated;
  writeAuthMap(map);
}

export function clearCompanyAuth(companyCode: string) {
  const map = readAuthMap();
  delete map[companyCode];
  writeAuthMap(map);
}
