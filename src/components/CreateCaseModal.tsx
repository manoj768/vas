import React, { useState, useEffect } from "react";
import { X, FilePlus, Building2 } from "lucide-react";
import { ValuationCase, OnboardedInstitution } from "../types";

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCase: (newCaseData: Partial<ValuationCase>) => void;
}

export const CreateCaseModal: React.FC<CreateCaseModalProps> = ({
  isOpen,
  onClose,
  onCreateCase,
}) => {
  const [institution, setInstitution] = useState("Hinduja Housing Finance Limited");
  const [institutionsList, setInstitutionsList] = useState<OnboardedInstitution[]>([]);
  const [isLoadingInstitutions, setIsLoadingInstitutions] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [loanType, setLoanType] = useState("Home Loan");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [propertyType, setPropertyType] = useState("Flat");

  useEffect(() => {
    if (isOpen) {
      setIsLoadingInstitutions(true);
      fetch("/api/institutions")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.institutions) && data.institutions.length > 0) {
            setInstitutionsList(data.institutions);
            if (!institution || !data.institutions.some((i: OnboardedInstitution) => i.name === institution)) {
              setInstitution(data.institutions[0].name);
            }
          }
        })
        .catch((err) => console.error("Error fetching institutions from API:", err))
        .finally(() => setIsLoadingInstitutions(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !address) {
      alert("Please fill in borrower name and address.");
      return;
    }

    onCreateCase({
      institution,
      customerName,
      loanType,
      phone: phone || "9876543210",
      address,
      propertyType,
    });

    onClose();
  };

  return (
    <div id="create-case-modal" className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 relative border border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 border-b pb-3">
          <div className="p-2 bg-blue-50 text-[#0080FF] rounded-lg">
            <FilePlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Create New Valuation Case</h3>
            <p className="text-xs text-gray-500">Assign a new property inspection task</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-gray-700 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#0080FF]" />
                Bank / Institution Name *
              </label>
              <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Synced with Central DB
              </span>
            </div>
            <select
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg bg-white font-bold text-gray-800 focus:ring-2 focus:ring-[#0080FF] focus:outline-none"
              disabled={isLoadingInstitutions}
            >
              {institutionsList.length > 0 ? (
                institutionsList.map((inst) => (
                  <option key={inst.id} value={inst.name}>
                    {inst.name} ({inst.category}) {inst.metaDocument ? "📄 [Verified Docx/Excel Format]" : ""}
                  </option>
                ))
              ) : (
                <>
                  <option value="Hinduja Housing Finance Limited">Hinduja Housing Finance Limited (HFC)</option>
                  <option value="HDFC Bank Home Loans">HDFC Bank Home Loans (Private Bank)</option>
                  <option value="ICICI Home Finance">ICICI Home Finance (HFC)</option>
                  <option value="Hero Housing Finance">Hero Housing Finance (HFC)</option>
                  <option value="State Bank of India (SBI)">State Bank of India (SBI) (PSU Bank)</option>
                </>
              )}
            </select>
            <p className="text-[10px] text-gray-500 mt-1 italic">
              🔒 Selected bank name is verified against central onboarding records and will be locked as uneditable across all survey steps.
            </p>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Borrower / Customer Name *</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Mr. Ankita Nigam"
              className="w-full p-2.5 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Loan Category</label>
              <select
                value={loanType}
                onChange={(e) => setLoanType(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white"
              >
                <option value="Home Loan">Home Loan</option>
                <option value="Loan Against Property">Loan Against Property</option>
                <option value="Commercial Loan">Commercial Loan</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="8448679869"
                className="w-full p-2.5 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Property Site Address *</label>
            <textarea
              rows={2}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Raj Nagar Extension, Vill Noor Nagar, GZB"
              className="w-full p-2.5 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Initial Property Type</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg bg-white"
            >
              <option value="Flat">Flat</option>
              <option value="Individual house">Individual house</option>
              <option value="Villa">Villa</option>
              <option value="Shop in Commercial Complex">Shop in Commercial Complex</option>
            </select>
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
              className="flex-1 py-2.5 bg-[#0080FF] hover:bg-[#0066CC] text-white font-bold rounded-lg shadow-xs"
            >
              Create Case
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
