import React, { useState, useEffect } from "react";
import { UserProfile } from "../types";
import { ShieldCheck, MapPin, User, Key, Building2, AlertCircle, Lock, X } from "lucide-react";

interface LoginModalProps {
  onLoginSuccess: (user: UserProfile) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onLoginSuccess,
  currentUser,
  onLogout,
  onClose,
}) => {
  const [emailOrPhone, setEmailOrPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone, password }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        if (data.token) {
          localStorage.setItem("drr_jwt_token", data.token);
        }
        onLoginSuccess(data.user);
      } else {
        setAuthError(data.message || "Invalid credentials. Please check your email and password.");
      }
    } catch (err: any) {
      setAuthError("Unable to connect to authentication server. Please check network connection.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto relative cursor-default"
      >
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
            title="Close / Return to App"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Top Header */}
        <div className="text-center space-y-1.5 border-b border-slate-800 pb-4 pr-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 mb-1">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            DRR Valuation Portal
          </h2>
          <p className="text-xs text-slate-400 font-semibold">
            Official Staff & Authorized Field Portal
          </p>
        </div>

        {currentUser ? (
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center border border-cyan-500/30">
                {currentUser.name[0]}
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-100">{currentUser.name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-cyan-400 font-bold capitalize">{currentUser.role}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-400">
                    <MapPin className="w-3 h-3" />
                    {currentUser.branch} Branch
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span>Account Status:</span>
                <span className="text-cyan-400">Active & Verified</span>
              </div>
              <div className="flex items-center justify-between font-bold">
                <span>Branch Authorization:</span>
                <span className="text-emerald-400 font-mono">{currentUser.branch} Portal</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  localStorage.removeItem("drr_jwt_token");
                  onLogout();
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 rounded-xl transition-colors border border-slate-700"
              >
                Sign Out
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold py-2 rounded-xl transition-colors shadow-md"
                >
                  Return to App
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {authError && (
              <div className="bg-red-950/80 border border-red-800/80 p-3 rounded-xl flex items-center gap-2 text-red-300 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Production Credential Form */}
            <form onSubmit={handleCredentialLogin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>Official Email or Mobile Number</span>
                  <span className="text-[10px] text-slate-500 font-normal">Registered Staff</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="e.g. admin@drrconsultants.in"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>Password</span>
                  <span className="text-[10px] text-cyan-400 font-normal">Secure Account</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all mt-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isLoggingIn ? "Verifying Credentials..." : "Sign In to Portal"}</span>
              </button>
            </form>

            {onClose && (
              <button
                onClick={onClose}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold py-2 rounded-xl transition-colors border border-slate-700"
              >
                Close & Continue to App
              </button>
            )}

            <p className="text-[10px] text-slate-500 text-center font-medium pt-1">
              DRR Valuation & Inspection System • Secure Single Sign-On Portal
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


