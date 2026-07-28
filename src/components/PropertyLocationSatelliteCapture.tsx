import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Navigation,
  Camera,
  ZoomIn,
  ZoomOut,
  CheckCircle,
  Download,
  Trash2,
  Info,
  AlertTriangle,
} from "lucide-react";

interface PropertyLocationSatelliteCaptureProps {
  latitude?: string;
  longitude?: string;
  propertyAddress?: string;
  caseId?: string;
  capturedMapImage?: string;
  onLocationChange: (lat: string, lon: string) => void;
  onCaptureMapImage: (imageDataUrl: string) => void;
}

export const PropertyLocationSatelliteCapture: React.FC<PropertyLocationSatelliteCaptureProps> = ({
  latitude = "28.6139",
  longitude = "77.2090",
  caseId = "101",
  capturedMapImage = "",
  onLocationChange,
  onCaptureMapImage,
}) => {
  const [lat, setLat] = useState<string>(latitude || "28.6139");
  const [lon, setLon] = useState<string>(longitude || "77.2090");
  const [zoom, setZoom] = useState<number>(17);
  const [mapMode, setMapMode] = useState<"openstreetmap" | "satellite">("openstreetmap");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string>(capturedMapImage || "");
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Dragging state & container dimensions
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 600,
    height: 280,
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    startLat: number;
    startLon: number;
  } | null>(null);

  // Sync props when changed externally
  useEffect(() => {
    if (latitude && latitude !== lat) setLat(latitude);
    if (longitude && longitude !== lon) setLon(longitude);
  }, [latitude, longitude]);

  useEffect(() => {
    if (capturedMapImage) setPreviewImage(capturedMapImage);
  }, [capturedMapImage]);

  // Measure container size dynamically
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const updateSize = () => {
      if (mapContainerRef.current) {
        const rect = mapContainerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setContainerSize({ width: rect.width, height: rect.height });
        }
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(mapContainerRef.current);
    return () => ro.disconnect();
  }, []);

  // Handle Get Current Location
  const handleGetCurrentLocation = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLat = position.coords.latitude.toFixed(6);
        const newLon = position.coords.longitude.toFixed(6);
        setLat(newLat);
        setLon(newLon);
        onLocationChange(newLat, newLon);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        console.warn("GPS Geolocation error:", err);
        setGpsError("Unable to retrieve high-accuracy GPS position. Please enter manually.");
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  // Handle manual coordinate changes
  const handleLatChange = (value: string) => {
    setLat(value);
    onLocationChange(value, lon);
  };

  const handleLonChange = (value: string) => {
    setLon(value);
    onLocationChange(lat, value);
  };

  // Pointer drag events for smooth pan on mobile touch & desktop mouse
  const handlePointerDown = (e: React.PointerEvent) => {
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startLat: parseFloat(lat) || 28.6139,
      startLon: parseFloat(lon) || 77.2090,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const n = Math.pow(2, zoom);
    const startRad = (dragStartRef.current.startLat * Math.PI) / 180;
    const startExactX = ((dragStartRef.current.startLon + 180) / 360) * n;
    const startExactY =
      ((1 - Math.log(Math.tan(startRad) + 1 / Math.cos(startRad)) / Math.PI) / 2) * n;

    const currentExactX = startExactX - dx / 256;
    const currentExactY = startExactY - dy / 256;

    const newLon = ((currentExactX / n) * 360 - 180).toFixed(6);
    const radNew = Math.atan(Math.sinh(Math.PI * (1 - 2 * (currentExactY / n))));
    const newLat = ((radNew * 180) / Math.PI).toFixed(6);

    setLat(newLat);
    setLon(newLon);
    onLocationChange(newLat, newLon);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Convert Lat/Lon & Zoom to Tile Coordinates
  const latLonToTile = (latNum: number, lonNum: number, zoomLevel: number) => {
    const rad = (latNum * Math.PI) / 180;
    const n = Math.pow(2, zoomLevel);
    const xtile = ((lonNum + 180) / 360) * n;
    const ytile = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
    return {
      exactX: xtile,
      exactY: ytile,
      tileX: Math.floor(xtile),
      tileY: Math.floor(ytile),
    };
  };

  // Calculate satellite tiles array for rendering viewport
  const latNum = parseFloat(lat) || 28.6139;
  const lonNum = parseFloat(lon) || 77.2090;
  const n = Math.pow(2, zoom);
  const latRad = (latNum * Math.PI) / 180;
  const exactX = ((lonNum + 180) / 360) * n;
  const exactY = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;

  const centerX = containerSize.width / 2;
  const centerY = containerSize.height / 2;
  const centerTileX = Math.floor(exactX);
  const centerTileY = Math.floor(exactY);

  const spanX = Math.ceil(containerSize.width / 512) + 2;
  const spanY = Math.ceil(containerSize.height / 512) + 2;

  const getTileUrl = (zLevel: number, tileX: number, tileY: number, mode: "openstreetmap" | "satellite") => {
    if (mode === "openstreetmap") {
      return `https://tile.openstreetmap.org/${zLevel}/${tileX}/${tileY}.png`;
    }
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zLevel}/${tileY}/${tileX}`;
  };

  const visibleTiles = [];
  for (let tx = centerTileX - spanX; tx <= centerTileX + spanX; tx++) {
    for (let ty = centerTileY - spanY; ty <= centerTileY + spanY; ty++) {
      if (tx < 0 || tx >= n || ty < 0 || ty >= n) continue;
      const screenX = (tx - exactX) * 256 + centerX;
      const screenY = (ty - exactY) * 256 + centerY;
      visibleTiles.push({
        key: `${mapMode}-${zoom}-${tx}-${ty}`,
        url: getTileUrl(zoom, tx, ty, mapMode),
        screenX,
        screenY,
      });
    }
  }

  // Capture Map Image: Clean Satellite Map + Pin + Bottom Center Lat/Long ONLY
  const handleCaptureMapImage = async () => {
    setIsCapturing(true);
    try {
      // High Resolution Canvas (1240px wide)
      const width = 1240;
      const height = 800;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setIsCapturing(false);
        return;
      }

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);

      const z = Math.min(Math.max(zoom, 14), 19);
      const { exactX: capExactX, exactY: capExactY, tileX: capTileX, tileY: capTileY } = latLonToTile(latNum, lonNum, z);

      const tileSize = 256;
      const tilesAcross = Math.ceil(width / tileSize) + 2;
      const tilesDown = Math.ceil(height / tileSize) + 2;

      const startTileX = capTileX - Math.floor(tilesAcross / 2);
      const startTileY = capTileY - Math.floor(tilesDown / 2);

      const capCenterX = width / 2;
      const capCenterY = height / 2;

      // Draw Satellite tiles asynchronously (Esri World Imagery)
      const tilePromises: Promise<void>[] = [];

      for (let tx = 0; tx < tilesAcross; tx++) {
        for (let ty = 0; ty < tilesDown; ty++) {
          const currTileX = startTileX + tx;
          const currTileY = startTileY + ty;

          const mapTileUrl = getTileUrl(z, currTileX, currTileY, mapMode);

          const p = new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              const tileOffsetX = (currTileX - capExactX) * tileSize + capCenterX;
              const tileOffsetY = (currTileY - capExactY) * tileSize + capCenterY;
              ctx.drawImage(img, tileOffsetX, tileOffsetY, tileSize, tileSize);
              resolve();
            };
            img.onerror = () => {
              const tileOffsetX = (currTileX - capExactX) * tileSize + capCenterX;
              const tileOffsetY = (currTileY - capExactY) * tileSize + capCenterY;
              ctx.fillStyle = "#1e293b";
              ctx.fillRect(tileOffsetX, tileOffsetY, tileSize, tileSize);
              resolve();
            };
            img.src = mapTileUrl;
          });
          tilePromises.push(p);
        }
      }

      await Promise.all(tilePromises);

      // Draw Center Target Pin (Sharp pin with tip exactly at capCenterX, capCenterY)
      const pinTipY = capCenterY;
      const headCenterY = pinTipY - 28;

      // Pin head circle
      ctx.beginPath();
      ctx.arc(capCenterX, headCenterY, 14, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      // Sharp Needle tapering to tip
      ctx.beginPath();
      ctx.moveTo(capCenterX - 10, headCenterY + 8);
      ctx.lineTo(capCenterX, pinTipY);
      ctx.lineTo(capCenterX + 10, headCenterY + 8);
      ctx.fillStyle = "#ef4444";
      ctx.fill();

      // Inner white dot in pin head
      ctx.beginPath();
      ctx.arc(capCenterX, headCenterY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Tiny white dot at exact center tip for sub-pixel accuracy
      ctx.beginPath();
      ctx.arc(capCenterX, pinTipY, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Bottom Center Lat / Long Overlay ONLY
      const textString = `Lat: ${latNum.toFixed(6)}  Long: ${lonNum.toFixed(6)}`;
      ctx.font = "bold 20px monospace";

      const textWidth = ctx.measureText(textString).width;
      const paddingX = 24;
      const pillWidth = textWidth + paddingX * 2;
      const pillHeight = 44;
      const pillX = (width - pillWidth) / 2;
      const pillY = height - pillHeight - 24;

      // Dark translucent pill container
      ctx.fillStyle = "rgba(15, 23, 42, 0.90)";
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 10);
      ctx.fill();

      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Lat / Long text centered inside pill
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(textString, width / 2, pillY + pillHeight / 2);

      // Export to Data URL
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setPreviewImage(dataUrl);
      onCaptureMapImage(dataUrl);
      setIsCapturing(false);
    } catch (err) {
      console.error("Map capture error:", err);
      setIsCapturing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl select-none">
      {/* Header & Title */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
        <div>
          <h4 className="text-sm font-extrabold text-cyan-400 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            Pin & Capture Property Location
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
            Satellite map view • Drag map to position pin at target location
          </p>
        </div>

        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? "animate-spin text-amber-300" : ""}`} />
          <span>{isLocating ? "Locating GPS..." : "Get Current Location"}</span>
        </button>
      </div>

      {gpsError && (
        <div className="bg-red-950/50 border border-red-800/80 rounded-xl p-3 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Instruction Box */}
      <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 text-xs text-amber-200/90 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Adjust the map as needed, or edit the latitude / longitude manually below. Click “Capture Map Image” once the location is correct.
        </p>
      </div>

      {/* Draggable Multi-Tile Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner group">
        {/* Top Left: Map Engine Switcher */}
        <div className="absolute top-3 left-3 z-20 flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg pointer-events-auto text-[10px] font-bold gap-1">
          <button
            type="button"
            onClick={() => setMapMode("openstreetmap")}
            className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
              mapMode === "openstreetmap"
                ? "bg-cyan-500 text-slate-950 font-black shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            🗺️ Map View
          </button>
          <button
            type="button"
            onClick={() => setMapMode("satellite")}
            className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
              mapMode === "satellite"
                ? "bg-cyan-500 text-slate-950 font-black shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            🛰️ Satellite
          </button>
        </div>

        {/* Zoom Controls Bar */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg pointer-events-auto">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 1, 19))}
            className="p-1.5 text-slate-300 hover:text-cyan-400 cursor-pointer active:scale-90 transition-transform"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono font-bold text-cyan-400 px-1">
            z{zoom}
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 1, 12))}
            className="p-1.5 text-slate-300 hover:text-cyan-400 cursor-pointer active:scale-90 transition-transform"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport Box */}
        <div
          ref={mapContainerRef}
          className="w-full h-64 sm:h-72 relative bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Tile Layer */}
          {visibleTiles.map((tile) => (
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

          {/* Fixed Center Sharp Target Pin */}
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="-translate-y-1/2 flex flex-col items-center">
              <MapPin className="w-8 h-8 text-red-500 fill-red-600 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]" />
              <div className="w-1.5 h-1.5 bg-white rounded-full border border-red-600 shadow-md -mt-1" />
            </div>
          </div>

          {/* Bottom Center Lat / Long Display Bar */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-slate-900/90 backdrop-blur-md border border-cyan-500/60 px-4 py-1.5 rounded-full text-xs font-mono font-bold text-slate-100 shadow-xl pointer-events-none flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Lat: {lat}</span>
            <span className="text-slate-500">|</span>
            <span>Long: {lon}</span>
          </div>
        </div>
      </div>

      {/* Manual Latitude & Longitude Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block text-slate-300 font-bold mb-1">
            Latitude
          </label>
          <input
            type="text"
            value={lat}
            onChange={(e) => handleLatChange(e.target.value)}
            placeholder="Coordinates from map or enter manually"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none transition-colors"
          />
          <p className="text-[10px] text-slate-400 mt-1 font-medium">
            Coordinates from map or enter manually
          </p>
        </div>

        <div>
          <label className="block text-slate-300 font-bold mb-1">
            Longitude
          </label>
          <input
            type="text"
            value={lon}
            onChange={(e) => handleLonChange(e.target.value)}
            placeholder="Coordinates from map or enter manually"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none transition-colors"
          />
          <p className="text-[10px] text-slate-400 mt-1 font-medium">
            Coordinates from map or enter manually
          </p>
        </div>
      </div>

      {/* Capture Map Image Button */}
      <button
        type="button"
        onClick={handleCaptureMapImage}
        disabled={isCapturing}
        className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
      >
        <Camera className={`w-4 h-4 ${isCapturing ? "animate-spin text-amber-300" : ""}`} />
        <span>{isCapturing ? "Capturing Satellite Image..." : "Capture Map Image"}</span>
      </button>

      {/* Preview Of Captured Satellite Map Image */}
      {previewImage && (
        <div className="mt-4 bg-slate-950 border border-emerald-800/60 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <CheckCircle className="w-4 h-4" />
              <span>Satellite Map Image Captured</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={previewImage}
                download={`Satellite_Map_Case_${caseId}.jpg`}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                title="Download Image"
              >
                <Download className="w-3 h-3 text-cyan-400" />
                <span>Save</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setPreviewImage("");
                  onCaptureMapImage("");
                }}
                className="text-slate-400 hover:text-red-400 text-[11px] font-bold px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Remove captured image"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-md">
            <img
              src={previewImage}
              alt="Captured Satellite Map"
              className="w-full h-auto max-h-72 object-contain bg-slate-950"
            />
          </div>
        </div>
      )}
    </div>
  );
};


