import React from "react";

export default function Footer() {
  const phoneNumber = "+201276427075"; // WhatsApp format: country code + number
  const whatsappLink = `https://wa.me/${phoneNumber}`;

  return (
    <footer className="border-t-2 border-blue-700 text-center p-4 text-blue-700 flex flex-col gap-2 justify-center items-center">
      <p>
        Mahragan Alkraza Ps. All rights reserved. © {new Date().getFullYear()}
      </p>
      <div
        className="flex flex-wrap mx-auto gap-2 justify-center items-center border rounded-full px-4 py-2 text-center"
        dir="ltr">
        <p>
          Powered by: <span className="font-bold">Michael George Alfred</span>
        </p>
        <p>
          Tel:{" "}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-bold">
            (+20)127 642 7075
          </a>
        </p>
      </div>
    </footer>
  );
}
