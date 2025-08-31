import React from "react";
export default function Footer() {
  return (
    <footer className="bg-[var(--color-bg-base)] border-t-2 border-[var(--color-bg-divider)] text-center py-4">
      <p>Mahragan Alkraza Ps. All rights reserved. © {new Date().getFullYear()}</p>
    </footer>
  );
}
