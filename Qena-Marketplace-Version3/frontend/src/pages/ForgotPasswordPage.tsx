import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSuccess("If that email is registered, a reset code was sent. Check your inbox.");
      setStep("otp");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      await api.post("/auth/verify-reset-otp", { email, otp });   // CHANGED from /auth/verify-otp
      setSuccess("Code verified! Set your new password.");
      setStep("password");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (newPassword !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, otp, new_password: newPassword });
      setSuccess("Password updated! Redirecting to login…");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const stepLabel = { email: "Forgot Password", otp: "Enter Code", password: "New Password" }[step];
  const stepNum   = { email: 1, otp: 2, password: 3 }[step];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                ${n <= stepNum ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                {n}
              </div>
              {n < 3 && <div className={`flex-1 h-0.5 w-8 ${n < stepNum ? "bg-blue-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">{stepLabel}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {step === "email" && "Enter your email and we'll send a 6-digit code."}
          {step === "otp"   && `Enter the 6-digit code sent to ${email}.`}
          {step === "password" && "Choose a strong new password."}
        </p>

        {error   && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

        {/* Step 1 — Email */}
        {step === "email" && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition">
              {loading ? "Sending…" : "Send Code"}
            </button>
          </form>
        )}

        {/* Step 2 — OTP */}
        {step === "otp" && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">6-digit code</label>
              <input
                type="text" required maxLength={6} pattern="\d{6}"
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm tracking-widest text-center text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="000000"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition">
              {loading ? "Verifying…" : "Verify Code"}
            </button>
            <button type="button" onClick={() => { setStep("email"); setError(""); setSuccess(""); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 underline">
              Use a different email
            </button>
          </form>
        )}

        {/* Step 3 — New password */}
        {step === "password" && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password" required minLength={8}
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <input
                type="password" required minLength={8}
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Repeat password"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition">
              {loading ? "Saving…" : "Update Password"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Remember your password?{" "}
          <a href="/login" className="text-blue-600 font-medium hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}