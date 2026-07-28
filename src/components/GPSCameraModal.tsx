import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Camera,
  Compass,
  MapPin,
  Clock,
  RefreshCw,
  Check,
  AlertTriangle,
  RotateCcw,
  Upload,
} from "lucide-react";

interface GPSCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (
    dataUrl: string,
    metadata: {
      lat: string;
      lng: string;
      address: string;
      heading: number;
      timestamp: string;
    }
  ) => void;
  title?: string;
}

export const GPSCameraModal: React.FC<GPSCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = "GPS Field Camera & OSM Geotag",
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  // Geo & OSM Address state
  const [latitude, setLatitude] = useState<number | null>(28.7236983);
  const [longitude, setLongitude] = useState<number | null>(77.1475839);
  const [accuracy, setAccuracy] = useState<number | null>(12);
  const [osmAddress, setOsmAddress] = useState<string>(
    "Pitampura, North West Delhi, Delhi, 110034, India"
  );
  const [district, setDistrict] = useState<string>("North West Delhi");
  const [stateName, setStateName] = useState<string>("Delhi");
  const [pincode, setPincode] = useState<string>("110034");
  const [isFetchingAddress, setIsFetchingAddress] = useState<boolean>(false);

  // Compass heading state (Needle is FIXED up, Dial rotates)
  const [heading, setHeading] = useState<number>(45); // Degrees (0-360)
  const [compassCardinal, setCompassCardinal] = useState<string>("NE");

  // Formatted date time string matching reference screenshot (DD/MM/YYYY hh:mm AM/PM)
  const getFormattedDateTime = (d = new Date()) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = pad(d.getMinutes());
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = pad(hours);

    return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
  };

  const [currentTime, setCurrentTime] = useState<string>(getFormattedDateTime());

  // Live clock timer
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCurrentTime(getFormattedDateTime());
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Reverse Geocode using OpenStreetMap Nominatim API
  const fetchOSMAddress = async (lat: number, lon: number) => {
    setIsFetchingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data) {
          if (data.display_name) setOsmAddress(data.display_name);
          if (data.address) {
            const addr = data.address;
            const dist =
              addr.state_district ||
              addr.district ||
              addr.county ||
              addr.suburb ||
              addr.city ||
              "North West Delhi";
            const st = addr.state || "Delhi";
            const pin = addr.postcode || addr.pincode || "110034";
            setDistrict(dist);
            setStateName(st);
            setPincode(pin);
          }
        }
      }
    } catch (err) {
      console.warn("OSM Reverse Geocode failed, using fallback cached address:", err);
    } finally {
      setIsFetchingAddress(false);
    }
  };

  // Get Live Geolocation
  useEffect(() => {
    if (!isOpen) return;

    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLatitude(lat);
          setLongitude(lon);
          setAccuracy(Math.round(pos.coords.accuracy));
          fetchOSMAddress(lat, lon);
        },
        (err) => {
          console.warn("Geolocation watch error:", err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isOpen]);

  // Compass Heading via DeviceOrientation
  useEffect(() => {
    if (!isOpen) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      let head = 0;
      if ("webkitCompassHeading" in e && typeof (e as any).webkitCompassHeading === "number") {
        head = (e as any).webkitCompassHeading;
      } else if (e.alpha !== null) {
        head = (360 - e.alpha) % 360;
      }
      head = Math.round(head);
      setHeading(head);

      // Convert heading to cardinal directions
      const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      const index = Math.round(head / 45) % 8;
      setCompassCardinal(directions[index]);
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => window.removeEventListener("deviceorientation", handleOrientation, true);
  }, [isOpen]);

  // Start Camera Stream
  useEffect(() => {
    if (!isOpen) return;

    let currentStream: MediaStream | null = null;

    async function initCamera() {
      setCameraError(null);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        currentStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
          setIsCameraActive(true);
        }
      } catch (err: any) {
        console.warn("Camera getUserMedia error:", err);
        setCameraError("Camera access unavailable in iframe/browser preview. You can upload a photo directly or use simulated live viewfinder.");
        setIsCameraActive(false);
      }
    }

    initCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      setStream(null);
      setIsCameraActive(false);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Draw compass helper matching geocamera.js spec exactly
  const drawGeocameraCompass = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    headingVal: number = 0
  ) => {
    const diameter = size;
    const centerX = x + diameter / 2;
    const centerY = y + diameter / 2;

    // 1. Draw compass needle (fixed, pointing north/up)
    ctx.save();
    ctx.translate(centerX, centerY);

    const needleWidth = diameter * 0.08;
    const needleLength = diameter * 0.35;

    // Needle base (light grey)
    ctx.beginPath();
    ctx.moveTo(0, needleWidth);
    ctx.lineTo(needleWidth * 0.5, 0);
    ctx.lineTo(0, -needleWidth * 0.3);
    ctx.lineTo(-needleWidth * 0.5, 0);
    ctx.closePath();
    ctx.fillStyle = "#d1d5db"; // Light grey
    ctx.fill();

    // Needle tip (red) - always points north (up)
    ctx.beginPath();
    ctx.moveTo(0, -needleLength);
    ctx.lineTo(needleWidth * 0.3, -needleWidth);
    ctx.lineTo(0, needleWidth * 0.2);
    ctx.lineTo(-needleWidth * 0.3, -needleWidth);
    ctx.closePath();
    ctx.fillStyle = "#e53e3e"; // Red tip
    ctx.fill();

    ctx.restore();

    // 2. Draw compass ring (rotates with heading)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((headingVal * Math.PI) / 180);

    const outerR = diameter / 2;
    const innerR = diameter * 0.35;

    // Ring Donut background
    ctx.beginPath();
    ctx.arc(0, 0, outerR, 0, Math.PI * 2, false);
    ctx.arc(0, 0, innerR, 0, Math.PI * 2, true);
    ctx.fillStyle = "rgba(35, 39, 48, 0.92)";
    ctx.fill();

    // Cardinal Letters ON Ring
    const textR = (outerR + innerR) / 2;
    ctx.font = `bold ${Math.round(diameter * 0.16)}px sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText("N", 0, -textR);
    ctx.fillText("E", textR, 0);
    ctx.fillText("S", 0, textR);
    ctx.fillText("W", -textR, 0);

    ctx.restore();
  };

  // Capture Photo and Burn OpenStreetMap Geotag, Timing, and Compass Watermark
  const handleCapturePhoto = () => {
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw Video or Fallback Canvas Background
    if (isCameraActive && videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      // Simulated High-Res Field Snapshot Canvas
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#1e293b");
      gradient.addColorStop(1, "#0f172a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid line details
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 2;
      for (let i = 0; i < canvas.width; i += 80) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let j = 0; j < canvas.height; j += 80) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("PROPERTY SITE SURVEY FIELD SNAPSHOT", canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = "18px sans-serif";
      ctx.fillStyle = "#38bdf8";
      ctx.fillText(`GPS ACCURACY: ±${accuracy}m | OSM GEOTAGGED`, canvas.width / 2, canvas.height / 2 + 20);
    }

    // ================= BURN GEOCAMERA COMPASS & METADATA OVERLAY =================
    // Top-Left Compass (40px offset, 13% size)
    const compassOffset = 40;
    const compassSize = Math.round(Math.min(canvas.width, canvas.height) * 0.13);
    drawGeocameraCompass(ctx, compassOffset, compassOffset, compassSize, heading);

    // Bottom-Left Metadata Overlay (Matching geocamera.js rendering)
    const metadataOffset = 40;
    const metadataFontSize = 26;
    const lineSpacing = metadataFontSize + 8;
    const metadataX = metadataOffset;
    const metadataY = canvas.height - metadataOffset;

    ctx.save();
    ctx.font = `bold ${metadataFontSize}px sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";

    // Line 1 (bottom line at metadataY): "Lat: {lat}, Lon: {lon}"
    const locationText = `Lat: ${latitude?.toFixed(6)}, Lon: ${longitude?.toFixed(6)}`;
    ctx.strokeText(locationText, metadataX, metadataY);
    ctx.fillText(locationText, metadataX, metadataY);

    // Line 2 (middle line): "{date} {time}"
    const timestampText = currentTime;
    ctx.strokeText(timestampText, metadataX, metadataY - lineSpacing);
    ctx.fillText(timestampText, metadataX, metadataY - lineSpacing);

    // Line 3 (top line): "Direction: {angle}° {dir}"
    const directionText = `Direction: ${heading}° ${compassCardinal}`;
    ctx.strokeText(directionText, metadataX, metadataY - lineSpacing * 2);
    ctx.fillText(directionText, metadataX, metadataY - lineSpacing * 2);

    ctx.restore();

    // Top Right Watermark Logo Badge
    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.fillRect(canvas.width - 240, 24, 216, 44);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("DRR OSM GEOTAG", canvas.width - 132, 52);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    onCapture(dataUrl, {
      lat: String(latitude),
      lng: String(longitude),
      address: `${district}, ${stateName} - ${pincode}`,
      heading,
      timestamp: currentTime,
    });

    onClose();
  };

  // Fallback File Upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (result) {
        onCapture(result, {
          lat: String(latitude),
          lng: String(longitude),
          address: osmAddress,
          heading,
          timestamp: currentTime,
        });
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      id="gps-camera-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/80 backdrop-blur-md select-none"
    >
      <div className="bg-slate-900 rounded-2xl max-w-lg w-full max-h-[95vh] flex flex-col overflow-hidden shadow-2xl border border-slate-700 relative text-white">
        {/* Header */}
        <div className="p-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#00A3FF]/20 text-[#00A3FF] rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{title}</h3>
              <p className="text-[10px] text-slate-400">
                Live Reverse Geocoding & Rotating Compass Dial
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Container */}
        <div className="relative flex-1 bg-black aspect-4/3 overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isCameraActive ? "block" : "hidden"}`}
          />

          {!isCameraActive && (
            <div className="p-6 text-center space-y-3 max-w-sm">
              <Camera className="w-12 h-12 text-slate-500 mx-auto animate-pulse" />
              <p className="text-xs text-slate-300 font-medium">{cameraError}</p>
              <p className="text-[11px] text-slate-400">
                You can tap "Capture Geotagged Snapshot" below to record field data with OSM geocoding and live compass watermark.
              </p>
            </div>
          )}

          {/* ================= COMPASS OVERLAY TOP LEFT (EXACT MATCH TO REFERENCE IMAGE RING COMPASS) ================= */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none drop-shadow-xl">
            <svg className="w-16 h-16" viewBox="0 0 80 80">
              {/* Rotating Ring Dial + Cardinal Letters */}
              <g style={{ transform: `rotate(${-heading}deg)`, transformOrigin: "40px 40px" }} className="transition-transform duration-150 ease-out">
                {/* Dark Charcoal Ring Donut (Hollow Transparent Center) */}
                <circle
                  cx="40"
                  cy="40"
                  r="31"
                  fill="none"
                  stroke="#232730"
                  strokeWidth="14"
                  opacity="0.92"
                />
                {/* Cardinal Letters ON Ring Band */}
                <text x="40" y="14" fill="#ffffff" fontWeight="800" fontSize="12" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif">
                  N
                </text>
                <text x="66" y="40" fill="#ffffff" fontWeight="800" fontSize="12" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif">
                  E
                </text>
                <text x="40" y="66" fill="#ffffff" fontWeight="800" fontSize="12" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif">
                  S
                </text>
                <text x="14" y="40" fill="#ffffff" fontWeight="800" fontSize="12" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif">
                  W
                </text>
              </g>

              {/* FIXED NEEDLE pointing UP (Non-rotating) */}
              {/* Tapered Red North Needle Pointing UP */}
              <polygon points="40,16 42.5,40 37.5,40" fill="#ef4444" />
              {/* Small White South Arrowhead Pointing DOWN */}
              <polygon points="40,48 43.5,40 36.5,40" fill="#ffffff" />
            </svg>
          </div>

          {/* ================= BOTTOM LEFT DETAILS OVERLAY (Exact match to reference photo layout) ================= */}
          <div className="absolute bottom-4 left-4 z-20 text-left text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] pointer-events-none space-y-0.5 font-sans">
            {/* Line 1: Direction */}
            <div className="text-sm font-bold tracking-wide">
              Direction: {heading}° {compassCardinal}
            </div>

            {/* Line 2: Date and Time (01/11/2025 03:14 PM) */}
            <div className="text-xs font-semibold">
              {currentTime}
            </div>

            {/* Line 3: Latitude, Longitude */}
            <div className="text-xs font-semibold">
              Lat: {latitude?.toFixed(6)}, Lon: {longitude?.toFixed(6)}
            </div>

            {/* Line 4: Location Address */}
            {district && (
              <div className="text-[11px] font-medium text-slate-200 pt-0.5">
                Loc: {district}, {stateName} - {pincode}
              </div>
            )}
          </div>
        </div>

        {/* Hidden Canvas for Watermark Generation */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Capture Action Bar */}
        <div className="p-3 bg-slate-800 border-t border-slate-700 flex items-center justify-between gap-3">
          <label className="py-2.5 px-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Upload Photo</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>

          <button
            onClick={handleCapturePhoto}
            className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Capture Geotagged Photo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
