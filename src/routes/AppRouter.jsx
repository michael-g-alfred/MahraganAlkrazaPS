import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Error from "../pages/Error";
import Home from "../pages/Home";
import Players from "../pages/Players";
import { Toaster } from "react-hot-toast";
import Login from "../pages/Login";
import Admin from "../pages/Admin";
import Brackets from "../pages/Brackets";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

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

function RequireAuth({ children }) {
  const { user, loadingAuth } = useAuth();
  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size={10} />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "login", element: <Login /> },
      {
        path: "players",
        element: (
          <RequireAuth>
            <Players />
          </RequireAuth>
        ),
      },
      {
        path: "admin",
        element: (
          <RequireAuth>
            <Admin />
          </RequireAuth>
        ),
      },
      {
        path: "brackets",
        element: (
          <RequireAuth>
            <Brackets />
          </RequireAuth>
        ),
      },
    ],
  },
  { path: "*", element: <Error /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
