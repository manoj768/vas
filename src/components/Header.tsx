import React from "react";
import { ChevronLeft, Menu, Sparkles, Home, User, MapPin } from "lucide-react";
import { UserProfile } from "../types";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onOpenDrawer: () => void;
  onGoHome?: () => void;
  activeViewTitle?: string;
  brandName?: string;
  syncStatusElement?: React.ReactNode;
  currentUser?: UserProfile | null;
  onOpenLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  showBack = false,
  onBack,
  onOpenDrawer,
  onGoHome,
  activeViewTitle,
  brandName = "DRR",
  syncStatusElement,
  currentUser,
  onOpenLogin,
}) => {
  return (
    <header id="drr-header" className="sticky top-0 z-30 bg-white text-slate-900 shadow-xs border-b border-slate-200 select-none">
      <div className="flex items-center justify-between px-3 py-2.5 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          {showBack ? (
            <button
              id="btn-header-back"
              onClick={onBack}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors active:scale-95"
              title="Go back"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
          ) : (
            <button
              id="btn-header-menu"
              onClick={onOpenDrawer}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors active:scale-95 flex flex-col gap-1 items-center justify-center w-8 h-8"
              title="Open Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}

          {onGoHome && showBack && (
            <button
              id="btn-header-home"
              onClick={onGoHome}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors active:scale-95"
              title="Return to Home Dashboard"
            >
              <Home className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* DRR Custom Brand Logo */}
        <div className="flex items-center gap-1.5 cursor-pointer group" onClick={onGoHome}>
          <span className="text-xl font-black tracking-wider text-blue-900 font-sans uppercase">
            {brandName.toUpperCase()}
          </span>
          {currentUser && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
              <MapPin className="w-2.5 h-2.5 text-blue-600" />
              {currentUser.branch}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {syncStatusElement}

          {onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 transition-all active:scale-95 shadow-2xs"
            >
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden xs:inline">
                {currentUser ? currentUser.name.split(" ")[0] : "Login"}
              </span>
            </button>
          )}

          {activeViewTitle && (
            <span className="text-xs bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full font-medium text-slate-700">
              {activeViewTitle}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

