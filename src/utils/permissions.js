const ROLES = {
  "michoolgeorge@gmail.com": {
    label: "أدمن عام",
    fullAdmin: true,
    canDeletePlayer: true,
    canTogglePaid: false,
    canExport: true,
  },
  "2@2.com": {
    label: "مسؤول الدفع",
    fullAdmin: false,
    canDeletePlayer: false,
    canTogglePaid: true,
    canExport: false,
  },
  "1@1.com": {
    label: "مشاهدة فقط",
    fullAdmin: false,
    canDeletePlayer: false,
    canTogglePaid: false,
    canExport: false,
  },
};

const DEFAULT_PRIVILEGES = {
  label: "بدون صلاحيات",
  fullAdmin: false,
  canDeletePlayer: false,
  canTogglePaid: false,
  canExport: false,
};

export function getPrivileges(email) {
  if (!email) return DEFAULT_PRIVILEGES;
  const key = email.trim().toLowerCase();
  return ROLES[key] || DEFAULT_PRIVILEGES;
}

export default ROLES;
