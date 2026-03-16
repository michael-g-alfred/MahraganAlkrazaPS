import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import TrophyIcon from "../icons/TrophyIcon";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div
        className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md border-2 border-blue-700"
        dir="rtl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 border-2 border-blue-700 rounded-full flex items-center justify-center mb-4">
            <TrophyIcon size={36} />
          </div>
          <h1 className="text-2xl font-bold text-blue-700">لوحة الأدمن</h1>
          <p className="text-gray-500 text-sm mt-1">مهرجان الكرازة المرقسية</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block mb-2 text-blue-700 font-semibold text-sm">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-blue-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block mb-2 text-blue-700 font-semibold text-sm">
              كلمة المرور
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-blue-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-xl border border-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`py-3 rounded-xl font-bold text-white transition ${
              loading ?
                "bg-blue-400 cursor-not-allowed"
              : "bg-blue-700 hover:bg-blue-800"
            }`}>
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    </div>
  );
}
