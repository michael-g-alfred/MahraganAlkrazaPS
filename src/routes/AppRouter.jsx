import React from "react";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Error from "../pages/Error";
import Home from "../pages/Home";
import { Provider } from "react-redux";
import { store } from "../redux/app/store";
import Players from "../pages/Players";
import { Toaster } from "react-hot-toast";

function RootLayout() {
  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <Navbar />
      <main className="flex-1 p-4">
        <Toaster />
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: "true",
        element: <Home />,
      },
      {
        path: "players",
        element: <Players />,
      },
    ],
  },
  { path: "*", element: <Error /> },
]);

export default function AppRouter() {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
}
