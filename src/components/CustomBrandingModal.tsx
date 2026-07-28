import React, { useState } from "react";
import { X, ShieldCheck, Copyright, Edit3, CheckCircle2 } from "lucide-react";

interface CustomBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandName: string;
  copyrightText: string;
  onSaveBranding: (newBrandName: string, newCopyrightText: string) => void;
}

export const CustomBrandingModal: React.FC<CustomBrandingModalProps> = ({
  isOpen,
  onClose,
  brandName,
  copyrightText,
  onSaveBranding,
}) => {
  const [inputBrand, setInputBrand] = useState(brandName);
  const [inputCopyright, setInputCopyright] = useState(copyrightText);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBranding(inputBrand || "DRR", inputCopyright || "Copyright © 2026 DRR Technologies. All Rights Reserved.");
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div id="custom-branding-modal" className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 relative border border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 border-b pb-3">
          <div className="p-2 bg-blue-50 text-[#0080FF] rounded-lg">
            <Copyright className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Custom DRR Name & Copyright</h3>
            <p className="text-xs text-gray-500">Customize DRR app branding and copyright notices</p>
          </div>
        </div>

        {isSaved ? (
          <div className="py-8 text-center space-y-2 bg-emerald-50 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-900">Custom Branding Updated!</h4>
            <p className="text-xs text-emerald-700">App header and copyright footer reflect changes now.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-[#0080FF]" />
                Custom DRR Brand Name
              </label>
              <input
                type="text"
                required
                value={inputBrand}
                onChange={(e) => setInputBrand(e.target.value)}
                placeholder="e.g. DRR, DRR Pro, My DRR"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0080FF] outline-hidden font-semibold text-gray-800"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                This name appears in the top navigation header and application title.
              </p>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Copyright Disclaimer & Ownership
              </label>
              <textarea
                rows={3}
                required
                value={inputCopyright}
                onChange={(e) => setInputCopyright(e.target.value)}
                placeholder="e.g. Copyright © 2026 DRR Technologies Inc. All Rights Reserved."
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0080FF] outline-hidden text-xs text-gray-800"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Appears on valuation report footers, drawer menu, and copyright disclaimers.
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] space-y-1">
              <span className="font-bold block">Protected Trademark & Copyright:</span>
              <p>
                DRR® is a registered trademark. Custom organization names retain official property valuation report compliance.
              </p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 font-bold rounded-lg shadow-xs"
              >
                Save Branding
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
