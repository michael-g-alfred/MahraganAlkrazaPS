import React from "react";
export default function Footer() {
  return (
    <footer className="border-t-2 border-blue-700 text-center py-4 text-blue-700">
      <p>
        Mahragan Alkraza Ps. All rights reserved. © {new Date().getFullYear()}
      </p>
    </footer>
  );
}
