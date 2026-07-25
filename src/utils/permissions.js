const ROLES = {
  "michoolgeorge@gmail.com": {
    label: "أدمن عام",
    canEditDashboard: true,
    canDeletePlayer: true,
    canToggleDetails: true,
    canTogglePaid: false,
    canExport: true,
    canRegisterResults: true,
    canViewStats: true,
    canDownloadReports: true,
  },
  "2@2.com": {
    label: "مسؤول الدفع",
    canEditDashboard: false,
    canDeletePlayer: false,
    canToggleDetails: false,
    canTogglePaid: true,
    canExport: false,
    canRegisterResults: true,
    canViewStats: true,
    canDownloadReports: false,
  },
  "1@1.com": {
    label: "مشاهدة فقط",
    canEditDashboard: false,
    canDeletePlayer: false,
    canToggleDetails: false,
    canTogglePaid: false,
    canExport: false,
    canRegisterResults: true,
    canViewStats: true,
    canDownloadReports: false,
  },
};

const DEFAULT_PRIVILEGES = {
  label: "بدون صلاحيات",
  canEditDashboard: false,
  canDeletePlayer: false,
  canToggleDetails: false,
  canTogglePaid: false,
  canExport: false,
  canRegisterResults: false,
  canViewStats: false,
  canDownloadReports: false,
};

export function getPrivileges(email) {
  if (!email) return DEFAULT_PRIVILEGES;
  const key = email.trim().toLowerCase();
  return ROLES[key] || DEFAULT_PRIVILEGES;
}

export default ROLES;
