import React from 'react'
import { Link } from 'react-router-dom';

export default function Error() {
  return (
    <div className="flex flex-col justify-center items-center">
      <h1 className="text-4xl font-bold mb-2 text-red-700">404 - Page Not Found</h1>
      <p className="mb-4 text-gray-700">Sorry, the page you are looking for does not exist.</p>
      <Link to="/" className="text-blue-700 font-bold hover:underline">
        Go back to Home
      </Link>
    </div>
  );
}
