import React, { useState, useRef, useEffect } from "react";
import {
  Folder,
  AlertCircle,
  User,
  Landmark,
  Calendar,
  Phone,
  MapPin,
  Pencil,
  Search,
  ChevronRight,
  Filter,
  Plus,
  Navigation,
  CheckCircle2,
  Clock,
  ZoomIn,
  ZoomOut,
  Globe,
  Layers,
} from "lucide-react";
import { ValuationCase } from "../types";

interface CaseDashboardProps {
  cases: ValuationCase[];
  onSelectCase: (caseItem: ValuationCase) => void;
  onCreateNewCase: () => void;
}

export const CaseDashboard: React.FC<CaseDashboardProps> = ({
  cases,
  onSelectCase,
  onCreateNewCase,
}) => {
  const [activeTab, setActiveTab] = useState<"list" | "map">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "open" | "pending" | "completed">("all");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("all");
  const [availableBranches, setAvailableBranches] = useState<string[]>(["Delhi NCR", "Lucknow", "Noida", "Ghaziabad", "Jaipur"]);

  useEffect(() => {
    fetch("/api/branches")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.branches && data.branches.length > 0) {
          setAvailableBranches(data.branches.map((b: any) => b.name));
        }
      })
      .catch(() => {});
  }, []);

  // Interactive OpenStreetMap Live GPS Map Engine State
  const [mapCenterLat, setMapCenterLat] = useState<number>(28.6139);
  const [mapCenterLon, setMapCenterLon] = useState<number>(77.2090);
  const [mapZoom, setMapZoom] = useState<number>(11);
  const [mapEngine, setMapEngine] = useState<"openstreetmap" | "satellite">("openstreetmap");
  const dashboardMapRef = useRef<HTMLDivElement | null>(null);
  const [mapContainerSize, setMapContainerSize] = useState<{ width: number; height: number }>({ width: 800, height: 500 });
  const [isMapDragging, setIsMapDragging] = useState<boolean>(false);
  const mapDragStartRef = useRef<{ x: number; y: number; startLat: number; startLon: number } | null>(null);

  // ResizeObserver for dashboard map container
  useEffect(() => {
    if (!dashboardMapRef.current) return;
    const updateMapSize = () => {
      if (dashboardMapRef.current) {
        const rect = dashboardMapRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setMapContainerSize({ width: rect.width, height: rect.height });
        }
      }
    };
    updateMapSize();
    const ro = new ResizeObserver(updateMapSize);
    ro.observe(dashboardMapRef.current);
    return () => ro.disconnect();
  }, [activeTab]);

  const handleMapPointerDown = (e: React.PointerEvent) => {
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setIsMapDragging(true);
    mapDragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startLat: mapCenterLat,
      startLon: mapCenterLon,
    };
  };

  const handleMapPointerMove = (e: React.PointerEvent) => {
    if (!isMapDragging || !mapDragStartRef.current) return;
    const dx = e.clientX - mapDragStartRef.current.x;
    const dy = e.clientY - mapDragStartRef.current.y;

    const n = Math.pow(2, mapZoom);
    const startRad = (mapDragStartRef.current.startLat * Math.PI) / 180;
    const startExactX = ((mapDragStartRef.current.startLon + 180) / 360) * n;
    const startExactY = ((1 - Math.log(Math.tan(startRad) + 1 / Math.cos(startRad)) / Math.PI) / 2) * n;

    const currentExactX = startExactX - dx / 256;
    const currentExactY = startExactY - dy / 256;

    const newLon = (currentExactX / n) * 360 - 180;
    const radNew = Math.atan(Math.sinh(Math.PI * (1 - 2 * (currentExactY / n))));
    const newLat = (radNew * 180) / Math.PI;

    setMapCenterLat(newLat);
    setMapCenterLon(newLon);
  };

  const handleMapPointerUp = (e: React.PointerEvent) => {
    if (!isMapDragging) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setIsMapDragging(false);
    mapDragStartRef.current = null;
  };

  const recenterMap = () => {
    setMapCenterLat(28.6139);
    setMapCenterLon(77.2090);
    setMapZoom(11);
  };

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.includes(searchQuery);

    const matchesBranch =
      selectedBranchFilter === "all" ||
      (c.branch && c.branch === selectedBranchFilter) ||
      (!c.branch && selectedBranchFilter === "Delhi NCR"); // default branch

    const matchesStatus =
      selectedFilter === "all" || c.status.toLowerCase() === selectedFilter;

    return matchesSearch && matchesBranch && matchesStatus;
  });

  const openCasesCount = cases.filter((c) => c.status === "Open").length;
  const pendingCasesCount = cases.filter((c) => c.status === "Pending").length;
  const completedCasesCount = cases.filter((c) => c.status === "Completed").length;

  return (
    <div id="drr-dashboard-container" className="flex flex-col min-h-screen bg-slate-950 text-slate-100 pb-16 font-sans">
      {/* View Mode Header Tabs */}
      <div className="bg-slate-900/90 backdrop-blur-md text-slate-200 sticky top-[52px] z-20 border-b border-slate-800 shadow-sm">
        <div className="flex max-w-3xl mx-auto px-2">
          <button
            id="tab-list-view"
            onClick={() => setActiveTab("list")}
            className={`flex-1 py-3 text-center text-xs font-bold tracking-wider uppercase transition-all relative ${
              activeTab === "list" ? "text-cyan-400 font-black" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            List View ({cases.length})
            {activeTab === "list" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-t-full shadow-xs" />
            )}
          </button>
          <button
            id="tab-map-view"
            onClick={() => setActiveTab("map")}
            className={`flex-1 py-3 text-center text-xs font-bold tracking-wider uppercase transition-all relative ${
              activeTab === "map" ? "text-cyan-400 font-black" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Map View
            {activeTab === "map" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-t-full shadow-xs" />
            )}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 py-4 space-y-4">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Open Cases Card */}
          <div
            onClick={() => setSelectedFilter(selectedFilter === "open" ? "all" : "open")}
            className={`cursor-pointer bg-slate-900 border rounded-2xl p-3.5 transition-all active:scale-98 shadow-md flex flex-col justify-between ${
              selectedFilter === "open"
                ? "border-cyan-400 ring-2 ring-cyan-400/20 bg-cyan-950/30"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                Open
              </span>
              <Folder className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-white font-mono tracking-tight">{openCasesCount}</p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">Active Valuations</p>
            </div>
          </div>

          {/* Pending Cases Card */}
          <div
            onClick={() => setSelectedFilter(selectedFilter === "pending" ? "all" : "pending")}
            className={`cursor-pointer bg-slate-900 border rounded-2xl p-3.5 transition-all active:scale-98 shadow-md flex flex-col justify-between ${
              selectedFilter === "pending"
                ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-950/30"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                Pending
              </span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-white font-mono tracking-tight">{pendingCasesCount}</p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">Awaiting Submission</p>
            </div>
          </div>

          {/* Completed Cases Card */}
          <div
            onClick={() => setSelectedFilter(selectedFilter === "completed" ? "all" : "completed")}
            className={`col-span-2 sm:col-span-1 cursor-pointer bg-slate-900 border rounded-2xl p-3.5 transition-all active:scale-98 shadow-md flex flex-col justify-between ${
              selectedFilter === "completed"
                ? "border-emerald-400 ring-2 ring-emerald-400/20 bg-emerald-950/30"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Done
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-white font-mono tracking-tight">{completedCasesCount}</p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">Submitted Reports</p>
            </div>
          </div>
        </div>

        {/* Search & Toolbar */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-2xl border border-slate-800 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                id="input-search-cases"
                type="text"
                placeholder="Search by ID, applicant, bank or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-[10px] bg-slate-800 text-slate-400 hover:text-white px-1.5 py-0.5 rounded-full"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                id="btn-filter-all"
                onClick={() => setSelectedFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  selectedFilter === "all"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>All</span>
              </button>

              <button
                id="btn-add-new-case"
                onClick={onCreateNewCase}
                className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-md active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Branch Filter Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold scrollbar-none">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider shrink-0 mr-1">Branch:</span>
            {["all", ...availableBranches].map((branch) => (
              <button
                key={branch}
                onClick={() => setSelectedBranchFilter(branch)}
                className={`px-2.5 py-1 rounded-lg border shrink-0 transition-all ${
                  selectedBranchFilter === branch
                    ? "bg-cyan-950 text-cyan-300 border-cyan-500/60 shadow-xs"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                {branch === "all" ? "🏢 All Branches" : branch}
              </button>
            ))}
          </div>
        </div>

        {/* LIST VIEW CASES */}
        {activeTab === "list" && (
          <div className="space-y-3">
            {filteredCases.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-2">
                <Folder className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-300">No matching valuation cases found</p>
                <p className="text-[11px] text-slate-500">Try adjusting your search criteria or create a new case.</p>
              </div>
            ) : (
              filteredCases.map((c) => {
                const statusColor =
                  c.status === "Open"
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                    : c.status === "Pending"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";

                return (
                  <div
                    key={c.id}
                    id={`case-card-${c.id}`}
                    onClick={() => onSelectCase(c)}
                    className="bg-slate-900 hover:bg-slate-900/90 rounded-2xl border border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer p-4 space-y-3 relative group shadow-md"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3 pr-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[11px] font-extrabold text-cyan-400 font-mono bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-800/50">
                            Ref #{c.id}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${statusColor}`}>
                            {c.status}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/50 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                            {c.branch || "Delhi NCR"}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug">
                          {c.institution}
                        </h3>
                      </div>

                      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0 mt-1" />
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1 border-t border-slate-800/60 font-medium">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="font-semibold text-slate-200 truncate">{c.customerName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Landmark className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{c.loanType}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="font-mono text-slate-400">{c.date}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <a
                          href={`tel:${c.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-cyan-400 font-semibold hover:underline font-mono"
                        >
                          {c.phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-1 text-xs text-slate-400">
                      <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed text-[11px] text-slate-300">{c.address}</span>
                    </div>

                    {c.remarks && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 italic bg-slate-950/60 p-2 rounded-xl border border-slate-800/50">
                        <Pencil className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{c.remarks}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* MAP VIEW WITH OPENSTREETMAP ENGINE */}
        {activeTab === "map" && (() => {
          const nMap = Math.pow(2, mapZoom);
          const latRadMap = (mapCenterLat * Math.PI) / 180;
          const exactXMap = ((mapCenterLon + 180) / 360) * nMap;
          const exactYMap = ((1 - Math.log(Math.tan(latRadMap) + 1 / Math.cos(latRadMap)) / Math.PI) / 2) * nMap;

          const centerXMap = mapContainerSize.width / 2;
          const centerYMap = mapContainerSize.height / 2;
          const centerTileXMap = Math.floor(exactXMap);
          const centerTileYMap = Math.floor(exactYMap);

          const spanXMap = Math.ceil(mapContainerSize.width / 512) + 2;
          const spanYMap = Math.ceil(mapContainerSize.height / 512) + 2;

          const getDashboardTileUrl = (zLevel: number, tileX: number, tileY: number, engine: "openstreetmap" | "satellite") => {
            if (engine === "openstreetmap") {
              return `https://tile.openstreetmap.org/${zLevel}/${tileX}/${tileY}.png`;
            }
            return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zLevel}/${tileY}/${tileX}`;
          };

          const dashboardVisibleTiles = [];
          for (let tx = centerTileXMap - spanXMap; tx <= centerTileXMap + spanXMap; tx++) {
            for (let ty = centerTileYMap - spanYMap; ty <= centerTileYMap + spanYMap; ty++) {
              if (tx < 0 || tx >= nMap || ty < 0 || ty >= nMap) continue;
              const screenX = (tx - exactXMap) * 256 + centerXMap;
              const screenY = (ty - exactYMap) * 256 + centerYMap;
              dashboardVisibleTiles.push({
                key: `${mapEngine}-${mapZoom}-${tx}-${ty}`,
                url: getDashboardTileUrl(mapZoom, tx, ty, mapEngine),
                screenX,
                screenY,
              });
            }
          }

          return (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="relative w-full h-[520px] bg-slate-950 overflow-hidden flex flex-col justify-between select-none">
                {/* Map Top Header Controls */}
                <div className="relative z-20 p-3 flex justify-between items-center bg-slate-900/90 border-b border-slate-800 backdrop-blur-md flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-100 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      Live GPS Navigation Map ({filteredCases.length} pin{filteredCases.length === 1 ? "" : "s"})
                    </span>
                    <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/80 px-2 py-0.5 rounded font-mono font-bold">
                      {mapEngine === "openstreetmap" ? "Standard Vector View" : "High-Res Satellite"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Map Engine Toggle */}
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setMapEngine("openstreetmap")}
                        className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                          mapEngine === "openstreetmap"
                            ? "bg-cyan-500 text-slate-950 font-black shadow"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        🗺️ Map View
                      </button>
                      <button
                        type="button"
                        onClick={() => setMapEngine("satellite")}
                        className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                          mapEngine === "satellite"
                            ? "bg-cyan-500 text-slate-950 font-black shadow"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        🛰️ Satellite
                      </button>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs">
                      <button
                        onClick={() => setMapZoom((z) => Math.min(z + 1, 18))}
                        className="p-1 text-slate-300 hover:text-cyan-400 transition-colors"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <span className="px-1.5 text-[10px] font-mono text-cyan-400 font-bold">z{mapZoom}</span>
                      <button
                        onClick={() => setMapZoom((z) => Math.max(z - 1, 6))}
                        className="p-1 text-slate-300 hover:text-cyan-400 transition-colors"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={recenterMap}
                      className="bg-slate-800 text-cyan-400 p-2 rounded-xl hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1 text-xs font-bold"
                      title="Recenter Map to NCR"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px]">Recenter</span>
                    </button>
                  </div>
                </div>

                {/* Map Viewport & Tile Layer */}
                <div
                  ref={dashboardMapRef}
                  className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing touch-none"
                  onPointerDown={handleMapPointerDown}
                  onPointerMove={handleMapPointerMove}
                  onPointerUp={handleMapPointerUp}
                  onPointerCancel={handleMapPointerUp}
                >
                  {dashboardVisibleTiles.map((tile) => (
                    <img
                      key={tile.key}
                      src={tile.url}
                      alt=""
                      draggable={false}
                      className="absolute w-[256px] h-[256px] object-cover pointer-events-none select-none filter contrast-105 saturate-105"
                      style={{
                        left: `${tile.screenX}px`,
                        top: `${tile.screenY}px`,
                      }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.opacity = "0.2";
                      }}
                    />
                  ))}

                  {/* Case Pins Overlay */}
                  {filteredCases.map((c, idx) => {
                    const caseLat = parseFloat(c.geoData?.latitude || "") || (28.6139 + ((idx % 5) - 2) * 0.04);
                    const caseLon = parseFloat(c.geoData?.longitude || "") || (77.2090 + (Math.floor(idx / 5) - 1) * 0.04);

                    const cRad = (caseLat * Math.PI) / 180;
                    const cExactX = ((caseLon + 180) / 360) * nMap;
                    const cExactY = ((1 - Math.log(Math.tan(cRad) + 1 / Math.cos(cRad)) / Math.PI) / 2) * nMap;

                    const pinScreenX = (cExactX - exactXMap) * 256 + centerXMap;
                    const pinScreenY = (cExactY - exactYMap) * 256 + centerYMap;

                    return (
                      <div
                        key={c.id}
                        style={{
                          left: `${pinScreenX}px`,
                          top: `${pinScreenY}px`,
                        }}
                        className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer z-10 group transition-transform hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCase(c);
                        }}
                      >
                        <div className="relative flex flex-col items-center">
                          <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-cyan-400 opacity-60"></span>
                          <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-2xl border-2 border-white font-bold text-xs z-10">
                            <MapPin className="w-4 h-4 fill-white text-cyan-600" />
                          </div>

                          <div className="mt-1 bg-slate-900/95 p-2 rounded-xl shadow-2xl border border-cyan-500/50 text-left min-w-[160px] max-w-[200px] backdrop-blur-md pointer-events-auto">
                            <p className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-wider truncate">{c.institution}</p>
                            <p className="text-[11px] font-black text-slate-100 truncate">{c.customerName}</p>
                            <p className="text-[10px] text-slate-400 truncate">{c.address}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCase(c);
                              }}
                              className="mt-1.5 w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-1 rounded-lg text-[10px] font-black transition-colors shadow"
                            >
                              Inspect Valuation →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Map Footer Info */}
                <div className="relative z-20 p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 backdrop-blur-md">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live GIS Navigation Engine
                  </span>
                  <span className="text-slate-500 font-mono">Center: {mapCenterLat.toFixed(4)}°, {mapCenterLon.toFixed(4)}°</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

