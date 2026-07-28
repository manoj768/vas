import React, { useState } from "react";
import { Compass, Search, MapPin, Building2, ExternalLink } from "lucide-react";

export const SaleComparablePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("Raj Nagar Extension");

  const mockComps = [
    {
      id: "C101",
      location: "Raj Nagar Extension, Ghaziabad",
      propertyType: "Flat (3 BHK)",
      rate: "₹ 4,850 / sq. ft",
      builtUpArea: "1,250 sq. ft",
      saleValue: "₹ 60,62,500",
      source: "Registry Records / Local Broker",
      date: "May 2026",
    },
    {
      id: "C102",
      location: "Vill Noor Nagar, Raj Nagar Ext",
      propertyType: "Individual House",
      rate: "₹ 5,200 / sq. ft",
      builtUpArea: "1,800 sq. ft",
      saleValue: "₹ 93,60,000",
      source: "Recent Bank Appraisal",
      date: "June 2026",
    },
    {
      id: "C103",
      location: "Sector 15, Vasundhara",
      propertyType: "Independent House",
      rate: "₹ 6,500 / sq. ft",
      builtUpArea: "2,000 sq. ft",
      saleValue: "₹ 1,30,000,000",
      source: "Sub-Registrar Registry Office",
      date: "July 2026",
    },
  ];

  return (
    <div id="sale-comparable-page" className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xs border border-slate-800 space-y-2">
        <div className="flex items-center gap-2">
          <Compass className="w-6 h-6 text-cyan-400" />
          <h2 className="text-base font-bold">Sale Comparable Market Comps</h2>
        </div>
        <p className="text-xs text-slate-300">
          Search real-time property transactions and recent bank appraisal rates in the locality.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search locality, sector or project..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0080FF] shadow-xs"
        />
      </div>

      {/* Comps List */}
      <div className="space-y-3">
        {mockComps.map((comp) => (
          <div key={comp.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#0080FF]" />
                {comp.location}
              </span>
              <span className="text-[10px] bg-blue-50 text-[#0080FF] font-extrabold px-2 py-0.5 rounded-full">
                {comp.date}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500 text-[10px] block">Property Type:</span>
                <span className="font-semibold text-gray-800 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  {comp.propertyType}
                </span>
              </div>

              <div>
                <span className="text-gray-500 text-[10px] block">Market Rate:</span>
                <span className="font-extrabold text-[#0080FF]">{comp.rate}</span>
              </div>

              <div>
                <span className="text-gray-500 text-[10px] block">Built-Up Area:</span>
                <span className="font-semibold text-gray-800">{comp.builtUpArea}</span>
              </div>

              <div>
                <span className="text-gray-500 text-[10px] block">Transaction Value:</span>
                <span className="font-bold text-emerald-700">{comp.saleValue}</span>
              </div>
            </div>

            <div className="text-[11px] text-gray-500 italic pt-1 border-t border-gray-100 flex items-center justify-between">
              <span>Source: {comp.source}</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
