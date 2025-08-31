import React from "react";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Error from "../pages/Error";
import Home from "../pages/Home";



function Layout() {
  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      {/* <Navbar /> */}
      <main className="flex-1 p-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home/>,
      },
    ],
  },
  { path: "*", element: <Error /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
