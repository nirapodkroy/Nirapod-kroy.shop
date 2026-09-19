import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Product, Order, AdminStats, AdminCustomer, UserTrackingEntry } from "../types";
import { handleLocalApi } from "../lib/mockApi";
import {
  X,
  Lock,
  KeyRound,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileSpreadsheet,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Truck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  LogOut,
  ExternalLink,
  DollarSign,
  Copy,
  Check,
  Send,
  Upload,
  Camera,
  Link2,
  Image as ImageIcon,
  SwitchCamera,
  Smartphone,
  Eye,
  EyeOff,
  Globe,
  Search,
  Images,
  CloudUpload,
  Download,
  Save,
  FileText,
  CheckCircle,
  Github,
  GitBranch,
  Mail,
  Tag,
  Percent,
  Sparkles,
  Activity,
  Clock,
  Monitor,
  MapPin,
  Compass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  BASE_CATEGORIES,
  categoryToSlug,
  GROCERIES_PARENT,
  GROCERY_SUBCATEGORIES,
  isGrocerySubcategory,
  getParentCategory,
  getSubcategories,
  getAllMainCategories,
  formatCategoryDisplayLabel
} from "../data/categories";

interface SecretAdminModalProps {
  products: Product[];
  onProductsUpdated: () => void;
}

export const SecretAdminModal: React.FC<SecretAdminModalProps> = ({ products, onProductsUpdated }) => {
  const {
    isAdminModalOpen,
    setIsAdminModalOpen,
    isAdminLoggedIn,
    adminToken,
    loginAdmin,
    logoutAdmin
  } = useAuth();
  const { addToast } = useToast();

  // Login Form State
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin View Tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "orders" | "customers" | "subscribers" | "tracking" | "sheets" | "github">("dashboard");

  // User Real-Time Tracking State
  const [userTracking, setUserTracking] = useState<UserTrackingEntry[]>([]);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);
  const [trackingStats, setTrackingStats] = useState<{
    totalVisits: number;
    activeNow: number;
    pageStats: Record<string, number>;
    deviceStats: Record<string, number>;
    browserStats: Record<string, number>;
  } | null>(null);
  const [trackingSearchTerm, setTrackingSearchTerm] = useState("");
  const [isTestingTrackingWebhook, setIsTestingTrackingWebhook] = useState(false);
  const [isCleaningOrderSheet, setIsCleaningOrderSheet] = useState(false);
  const [isFixingCustomersSheet, setIsFixingCustomersSheet] = useState(false);

  // Subscribers State
  const [subscribers, setSubscribers] = useState<{ email: string; source: string; subscribedAt: string }[]>([]);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
  const [subscriberSearchTerm, setSubscriberSearchTerm] = useState("");
  const [subscriberToDelete, setSubscriberToDelete] = useState<string | null>(null);
  const [isSyncingFromSheets, setIsSyncingFromSheets] = useState(false);

  // GitHub Auto-Sync State
  const [githubRepo, setGithubRepo] = useState(() => localStorage.getItem("nirapod_gh_repo") || "nirapodkroy/Nirapod-kroy.shop");
  const [githubBranch, setGithubBranch] = useState(() => localStorage.getItem("nirapod_gh_branch") || "main");
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem("nirapod_gh_token") || "");
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [isPushingToGithub, setIsPushingToGithub] = useState(false);
  const [isTestingGithubConnection, setIsTestingGithubConnection] = useState(false);
  const [githubConnectionInfo, setGithubConnectionInfo] = useState<{
    status: "idle" | "success" | "error";
    message: string;
    details?: string;
  }>({ status: "idle", message: "" });
  const [lastGithubCommitUrl, setLastGithubCommitUrl] = useState<string | null>(() => localStorage.getItem("nirapod_gh_last_commit") || null);
  const [lastGithubSyncTime, setLastGithubSyncTime] = useState<string | null>(() => localStorage.getItem("nirapod_gh_last_time") || null);

  // Admin Data State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; customerName: string; total: number } | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<{ id: string; name: string; email: string } | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [isTestingSubscribeWebhook, setIsTestingSubscribeWebhook] = useState(false);
  const [isTestingEmailAlert, setIsTestingEmailAlert] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Google Sheets Live Sync & Admin Panel Persistence States
  const [isLiveSheetMode, setIsLiveSheetMode] = useState(false);
  const [isSyncedDataSaved, setIsSyncedDataSaved] = useState(false);
  const [isSavingSyncedData, setIsSavingSyncedData] = useState(false);
  const [isClearingSavedData, setIsClearingSavedData] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [orderTrackingDrafts, setOrderTrackingDrafts] = useState<Record<string, { trackingNumber?: string; orderTrackingDetails?: string; status?: string }>>({});
  const [isUpdatingTracking, setIsUpdatingTracking] = useState<Record<string, boolean>>({});

  // Admin Products State (Includes inactive products)
  const [adminProducts, setAdminProducts] = useState<Product[]>(products);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState<"all" | "active" | "inactive" | "offer_zone" | "affiliate">("all");
  const [productToDelete, setProductToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isPublishingLive, setIsPublishingLive] = useState(false);
  const [lastPublishedTime, setLastPublishedTime] = useState<string | null>(null);

  // Memoized categories combining standard + products - declared at top level
  const availableAdminCategories = useMemo(() => {
    const set = new Set<string>(BASE_CATEGORIES.filter(c => c !== "All"));
    if (Array.isArray(products)) {
      products.forEach(p => {
        if (p.category && typeof p.category === "string" && p.category.trim()) {
          set.add(p.category.trim());
        }
      });
    }
    return Array.from(set);
  }, [products]);

  // Memoized Main Categories for Parent selection
  const availableMainCategories = useMemo(() => {
    return getAllMainCategories(products);
  }, [products]);

  // Editable Revenue State
  const [isEditingRevenue, setIsEditingRevenue] = useState(false);
  const [customRevenueInput, setCustomRevenueInput] = useState("");
  const [isSavingRevenue, setIsSavingRevenue] = useState(false);

  // Fallback-resilient fetch helper for admin actions
  const safeAdminFetch = async (input: string, init?: RequestInit): Promise<Response> => {
    try {
      const res = await fetch(input, init);
      const contentType = res.headers.get("content-type") || "";
      if (res.ok && !contentType.includes("text/html")) {
        return res;
      }
      if (
        res.status !== 401 &&
        res.status !== 403 &&
        res.status !== 404 &&
        res.status !== 500 &&
        res.status !== 502 &&
        res.status !== 503 &&
        !contentType.includes("text/html")
      ) {
        return res;
      }
    } catch (e) {
      console.warn(`Admin fetch network error on ${input}, switching to local store:`, e);
    }
    try {
      return await handleLocalApi(String(input), init);
    } catch (fallbackErr) {
      console.error(`Local API fallback error on ${input}:`, fallbackErr);
      return new Response(JSON.stringify({ error: "Local API failure" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  };

  // Product Form Modal State (Add / Edit)
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formRegularPrice, setFormRegularPrice] = useState("");
  // Category configuration states:
  // "main" -> Product is added under a Main Category
  // "sub" -> Product is added as a Sub-category under a parent category
  const [categoryClassification, setCategoryClassification] = useState<"main" | "sub">("main");
  const [formCategory, setFormCategory] = useState("Groceries & Food");
  const [formParentCategory, setFormParentCategory] = useState("");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customParentCategoryName, setCustomParentCategoryName] = useState("");
  const [isCustomMainCategory, setIsCustomMainCategory] = useState(false);
  const [isCustomParentCategory, setIsCustomParentCategory] = useState(false);

  // Subcategory suggestions based on selected parent category
  const currentSubcategorySuggestions = useMemo(() => {
    const parent = isCustomParentCategory ? customParentCategoryName.trim() : formParentCategory.trim();
    if (!parent) return [];
    return getSubcategories(parent, products);
  }, [formParentCategory, customParentCategoryName, isCustomParentCategory, products]);
  const [formStock, setFormStock] = useState("25");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formImages, setFormImages] = useState<string[]>([]);
  const [linkInputUrl, setLinkInputUrl] = useState("");
  const [formBadge, setFormBadge] = useState("");
  const [formFeatured, setFormFeatured] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsOfferZone, setFormIsOfferZone] = useState(false);
  const [formOfferDiscountNote, setFormOfferDiscountNote] = useState("");
  const [formIsAffiliate, setFormIsAffiliate] = useState(false);
  const [formAffiliateUrl, setFormAffiliateUrl] = useState("");
  const [formAffiliateSource, setFormAffiliateSource] = useState("");
  const [formAffiliateButtonText, setFormAffiliateButtonText] = useState("");
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Multi-method image upload states (Device, Link, Camera)
  const [imageInputMode, setImageInputMode] = useState<"device" | "link" | "camera">("device");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageFileName, setImageFileName] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Stop Camera helper
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Start Camera helper
  const startCamera = async (facing: "environment" | "user" = cameraFacingMode) => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera is not supported in this browser. Please use Device Upload or Web Link.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setCameraStream(stream);
      setIsCameraActive(true);
      setCameraFacingMode(facing);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      let message = "Could not access camera. Please allow camera permissions in browser settings.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        message = "Camera permission was denied. Please allow camera access in browser address bar.";
      }
      setCameraError(message);
      setIsCameraActive(false);
    }
  };

  // Switch between front/back cameras
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacingMode === "environment" ? "user" : "environment";
    startCamera(nextFacing);
  };

  // Snap photo from camera (can snap multiple photos to gallery)
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      const vWidth = video.videoWidth || 800;
      const vHeight = video.videoHeight || 600;
      const maxDim = 800;
      let targetW = vWidth;
      let targetH = vHeight;
      if (targetW > maxDim || targetH > maxDim) {
        if (targetW > targetH) {
          targetH = Math.round((targetH * maxDim) / targetW);
          targetW = maxDim;
        } else {
          targetW = Math.round((targetW * maxDim) / targetH);
          targetH = maxDim;
        }
      }
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, targetW, targetH);
        const snapshotUrl = canvas.toDataURL("image/jpeg", 0.76);
        setFormImages((prev) => {
          const updated = [...prev, snapshotUrl];
          if (!formImageUrl) setFormImageUrl(updated[0]);
          return updated;
        });
        if (!formImageUrl) setFormImageUrl(snapshotUrl);
        setImageFileName(`camera-photo-${Date.now()}.jpg`);
        addToast("Photo added to gallery! Take more or click Stop.", "success");
      }
    } catch (err) {
      console.error("Failed to capture photo:", err);
      addToast("Failed to capture photo", "error");
    }
  };

  // Helper to compress a single image file to avoid exceeding browser storage quota
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round((width * MAX_HEIGHT) / height);
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL("image/jpeg", 0.76));
            } else {
              resolve(e.target?.result as string);
            }
          } catch {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error("Failed to parse image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  // Compress & process single or multiple image files from device
  const handleProcessMultipleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      addToast("Please select valid image files (JPG, PNG, WebP)", "warning");
      return;
    }

    setIsProcessingImage(true);
    try {
      const results: string[] = [];
      for (const file of files) {
        try {
          const compressed = await compressImageFile(file);
          results.push(compressed);
        } catch (err) {
          console.error("Failed to process file", file.name, err);
        }
      }

      if (results.length > 0) {
        setFormImages((prev) => {
          const updated = [...prev, ...results];
          if (!formImageUrl) setFormImageUrl(updated[0]);
          return updated;
        });
        if (!formImageUrl) setFormImageUrl(results[0]);
        setImageFileName(files.length === 1 ? files[0].name : `${files.length} images selected`);
        addToast(
          files.length === 1
            ? "Photo added to gallery!"
            : `${results.length} photos added to gallery!`,
          "success"
        );
      }
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleProcessFile = (file: File) => {
    handleProcessMultipleFiles([file]);
  };

  // Add web link to gallery
  const handleAddLinkImage = () => {
    if (!linkInputUrl.trim()) return;
    const url = linkInputUrl.trim();
    setFormImages((prev) => {
      const updated = [...prev, url];
      if (!formImageUrl) setFormImageUrl(updated[0]);
      return updated;
    });
    if (!formImageUrl) setFormImageUrl(url);
    setLinkInputUrl("");
    addToast("Web image added to gallery!", "success");
  };

  // Set an image as primary cover
  const handleSetAsCover = (index: number) => {
    setFormImages((prev) => {
      const target = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      const updated = [target, ...rest];
      setFormImageUrl(target);
      return updated;
    });
    addToast("Cover photo updated! This photo will be shown first.", "info");
  };

  // Remove single image from gallery
  const handleRemoveImage = (index: number) => {
    setFormImages((prev) => {
      const removed = prev[index];
      const updated = prev.filter((_, i) => i !== index);
      if (formImageUrl === removed) {
        setFormImageUrl(updated[0] || "");
      }
      return updated;
    });
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Update video stream reference when camera turns active
  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(console.error);
    }
  }, [isCameraActive, cameraStream]);

  // Fetch admin stats, orders, and settings when authenticated
  const fetchAdminData = async () => {
    if (!adminToken) return;

    // 1. Stats
    try {
      const statsRes = await safeAdminFetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData?.stats) {
          setStats(statsData.stats);
          if (typeof statsData.stats.isSaved === "boolean") {
            setIsSyncedDataSaved(statsData.stats.isSaved);
            if (!statsData.stats.isSaved && !isLiveSheetMode) {
              setIsLiveSheetMode(false);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Admin stats fetch fallback:", e);
    }

    // 2. Orders
    setIsLoadingOrders(true);
    try {
      const ordersRes = await safeAdminFetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData?.orders || []);
        if (typeof ordersData?.isSaved === "boolean") {
          setIsSyncedDataSaved(ordersData.isSaved);
        }
      }
    } catch (e) {
      console.warn("Admin orders fetch fallback:", e);
    } finally {
      setIsLoadingOrders(false);
    }

    // 2.1 Customers
    setIsLoadingCustomers(true);
    try {
      const custRes = await safeAdminFetch("/api/admin/customers", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData?.customers || []);
      }
    } catch (e) {
      console.warn("Admin customers fetch fallback:", e);
    } finally {
      setIsLoadingCustomers(false);
    }

    // 2.2 Subscribers
    setIsLoadingSubscribers(true);
    try {
      const subsRes = await safeAdminFetch("/api/admin/subscribers", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubscribers(subsData?.subscribers || []);
      }
    } catch (e) {
      console.warn("Admin subscribers fetch fallback:", e);
    } finally {
      setIsLoadingSubscribers(false);
    }

    // 2.3 User Real-Time Tracking
    setIsLoadingTracking(true);
    try {
      const trackRes = await safeAdminFetch("/api/admin/tracking", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (trackRes.ok) {
        const trackData = await trackRes.json();
        setUserTracking(trackData?.tracking || []);
        setTrackingStats({
          totalVisits: trackData?.totalVisits || 0,
          activeNow: trackData?.activeNow || 0,
          pageStats: trackData?.pageStats || {},
          deviceStats: trackData?.deviceStats || {},
          browserStats: trackData?.browserStats || {}
        });
      }
    } catch (e) {
      console.warn("Admin tracking fetch fallback:", e);
    } finally {
      setIsLoadingTracking(false);
    }

    // 3. Settings
    try {
      const settingsRes = await safeAdminFetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        setWebhookUrl(sData?.webhookUrl || "");
      }
    } catch (e) {
      console.warn("Admin settings fetch fallback:", e);
    }

    // 4. Products (All products including inactive)
    try {
      const prodsRes = await safeAdminFetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (prodsRes.ok) {
        const pData = await prodsRes.json();
        if (Array.isArray(pData?.products)) {
          setAdminProducts(pData.products);
        }
      }
    } catch (e) {
      console.warn("Admin products fetch fallback:", e);
    }
  };

  // One-click Save & Publish to Live Server
  const handlePublishLive = async () => {
    setIsPublishingLive(true);
    try {
      const payload = { products: adminProducts };
      const res = await safeAdminFetch("/api/admin/publish-live", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setLastPublishedTime(new Date().toLocaleTimeString("bn-BD"));
        addToast(data.message || "সকল পণ্য ও ক্যাটাগরি সফলভাবে লাইভ সার্ভারে সেভ ও পাবলিশ করা হয়েছে!", "success");
        try {
          const publicCatalog = adminProducts.filter(p => p.isActive !== false);
          localStorage.setItem("nirapod_products_cache", JSON.stringify(publicCatalog));
          localStorage.setItem("nirapod_products_modified", String(Date.now()));
          window.dispatchEvent(new CustomEvent("nirapod-catalog-updated"));
        } catch {}
        onProductsUpdated();
      } else {
        addToast("লাইভ সার্ভারে সেভ সম্পন্ন হয়নি", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("লাইভ সেভ এরর", "error");
    } finally {
      setIsPublishingLive(false);
    }
  };

  // Export & Download products.json
  const handleExportProductsJson = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(adminProducts, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `nirapod-products-${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      addToast("products.json ব্যাকআপ ফাইল ডাউনলোড শুরু হয়েছে!", "success");
    } catch {
      addToast("ডাউনলোড ব্যর্থ হয়েছে", "error");
    }
  };

  // Copy products JSON to clipboard
  const handleCopyProductsJson = () => {
    try {
      const jsonStr = JSON.stringify(adminProducts, null, 2);
      navigator.clipboard.writeText(jsonStr);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 3000);
      addToast("সকল পণ্যের JSON সফলভাবে কপি হয়েছে! এবার GitHub-এ পেস্ট করুন।", "success");
    } catch {
      addToast("কপি করতে সমস্যা হয়েছে", "error");
    }
  };

  // Save GitHub Config
  const handleSaveGithubSettings = (silent = false) => {
    const cleanRepo = githubRepo.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
    const cleanBranch = githubBranch.trim() || "main";
    const token = githubToken.trim();

    localStorage.setItem("nirapod_gh_repo", cleanRepo);
    localStorage.setItem("nirapod_gh_branch", cleanBranch);
    localStorage.setItem("nirapod_gh_token", token);
    setGithubRepo(cleanRepo);
    setGithubBranch(cleanBranch);

    if (!silent) {
      addToast("GitHub সেটিংস সফলভাবে সেভ করা হয়েছে!", "success");
    }
  };

  // Helper to reliably get valid admin token for API headers
  const getAdminAuthToken = (): string => {
    return (
      adminToken ||
      localStorage.getItem("auracart_admin_token") ||
      sessionStorage.getItem("auracart_admin_token") ||
      localStorage.getItem("nirapod_admin_token") ||
      sessionStorage.getItem("nirapod_admin_token") ||
      "adm_master_session"
    );
  };

  // Test GitHub Token and Repo access
  const handleTestGithubConnection = async () => {
    const token = githubToken.trim();
    const cleanRepo = githubRepo.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");

    if (!token) {
      addToast("টেস্ট করার জন্য আগে GitHub Personal Access Token দিন", "warning");
      setGithubConnectionInfo({
        status: "error",
        message: "টোকেন খালি! আপনার GitHub Personal Access Token পেস্ট করুন।"
      });
      return;
    }

    if (!cleanRepo) {
      addToast("রিপোজিটরির নাম দিন (যেমন: nirapodkroy/Nirapod-kroy.shop)", "warning");
      return;
    }

    setIsTestingGithubConnection(true);
    setGithubConnectionInfo({ status: "idle", message: "কানেকশন টেস্ট করা হচ্ছে..." });

    try {
      const activeAdminToken = getAdminAuthToken();
      let verifiedData: { repo: string; defaultBranch: string; private?: boolean } | null = null;
      let lastErrorMessage = "";

      try {
        const res = await fetch("/api/admin/github/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeAdminToken}`
          },
          body: JSON.stringify({ token, repo: cleanRepo })
        });

        if (res.ok) {
          verifiedData = await res.json();
        } else {
          const errJson = await res.json().catch(() => ({}));
          lastErrorMessage = errJson.error || "";
        }
      } catch {
        // network issue with server endpoint, fallback to direct client call below
      }

      // If server check didn't succeed, fallback to direct client-side fetch to GitHub API
      if (!verifiedData) {
        const authHeader = token.startsWith("ghp_") ? `token ${token}` : `Bearer ${token}`;
        const directRes = await fetch(`https://api.github.com/repos/${cleanRepo}`, {
          headers: {
            Authorization: authHeader,
            Accept: "application/vnd.github.v3+json"
          }
        });

        if (directRes.ok) {
          const repoData = await directRes.json();
          verifiedData = {
            repo: repoData.full_name,
            defaultBranch: repoData.default_branch || "main",
            private: repoData.private
          };
        } else {
          if (directRes.status === 401) {
            lastErrorMessage = "GitHub Token সঠিক নয় বা মেয়াদ শেষ হয়েছে। সঠিক Personal Access Token দিন।";
          } else if (directRes.status === 404) {
            lastErrorMessage = `Repository '${cleanRepo}' পাওয়া যায়নি। রিপোজিটরির নাম ও ওনার সঠিক কিনা চেক করুন।`;
          } else if (directRes.status === 403) {
            lastErrorMessage = "টোকেনে 'repo' পারমিশন নেই। টোকেন জেনারেট করার সময় 'repo' চেকবক্সে টিক দিন।";
          }
        }
      }

      if (verifiedData) {
        setGithubConnectionInfo({
          status: "success",
          message: `কানেকশন সফল! রিপোজিটরি: ${verifiedData.repo}`,
          details: `ডিফল্ট ব্রাঞ্চ: ${verifiedData.defaultBranch}। ১-ক্লিকে GitHub-এ পুশ করার জন্য প্রস্তুত।`
        });
        if (verifiedData.defaultBranch) {
          setGithubBranch(verifiedData.defaultBranch);
          localStorage.setItem("nirapod_gh_branch", verifiedData.defaultBranch);
        }
        addToast("GitHub কানেকশন সফল!", "success");
      } else {
        const errorMsg = lastErrorMessage || "GitHub কানেকশন ব্যর্থ হয়েছে। Token বা রিপোজিটরি সঠিক কিনা যাচাই করুন।";
        setGithubConnectionInfo({
          status: "error",
          message: errorMsg
        });
        addToast(errorMsg, "error");
      }
    } catch (err: any) {
      setGithubConnectionInfo({
        status: "error",
        message: `নেটওয়ার্ক এরর: ${err.message || "কানেক্ট করা সম্ভব হয়নি"}`
      });
      addToast(`কানেকশন টেস্ট এরর: ${err.message}`, "error");
    } finally {
      setIsTestingGithubConnection(false);
    }
  };

  // Push directly to GitHub repo
  const handlePushToGithub = async () => {
    const token = githubToken.trim();
    const cleanRepo = githubRepo.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
    const cleanBranch = githubBranch.trim() || "main";

    if (!token) {
      setActiveTab("github");
      addToast("GitHub-এ পুশ করার জন্য আগে আপনার GitHub Personal Access Token দিন", "warning");
      setGithubConnectionInfo({
        status: "error",
        message: "টোকেন পাওয়া যায়নি! নিচে আপনার GitHub Personal Access Token দিয়ে 'টোকেন সংরক্ষণ' করুন।"
      });
      return;
    }

    setIsPushingToGithub(true);
    handleSaveGithubSettings(true);

    try {
      // 1. Try server backend endpoint first
      const activeAdminToken = getAdminAuthToken();
      const serverPushRes = await fetch("/api/admin/github/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeAdminToken}`
        },
        body: JSON.stringify({
          token,
          repo: cleanRepo,
          branch: cleanBranch,
          products: adminProducts
        })
      });

      if (serverPushRes.ok) {
        const data = await serverPushRes.json();
        const commitUrl = data.commitUrl || `https://github.com/${cleanRepo}/commits/${cleanBranch}`;
        const timeStr = new Date().toLocaleTimeString("bn-BD");
        setLastGithubCommitUrl(commitUrl);
        setLastGithubSyncTime(timeStr);
        localStorage.setItem("nirapod_gh_last_commit", commitUrl);
        localStorage.setItem("nirapod_gh_last_time", timeStr);
        setGithubConnectionInfo({
          status: "success",
          message: "সর্বশেষ পুশ সফল হয়েছে!",
          details: `কমিট লিংক: ${commitUrl}`
        });

        try {
          const publicCatalog = adminProducts.filter(p => p.isActive !== false);
          localStorage.setItem("nirapod_products_cache", JSON.stringify(publicCatalog));
          window.dispatchEvent(new CustomEvent("nirapod-catalog-updated"));
        } catch {}
        onProductsUpdated();

        addToast("সফলভাবে GitHub-এ পুশ ও কমিট হয়েছে! ১ মিনিটের মধ্যে লাইভ সাইট আপডেট হবে।", "success");
        return;
      }

      // If server returned a business error (like 401, 403, 404, 409)
      const errJson = await serverPushRes.json().catch(() => ({}));
      if (errJson.error && serverPushRes.status !== 404) {
        addToast(`GitHub Sync: ${errJson.error}`, "error");
        setGithubConnectionInfo({ status: "error", message: errJson.error });
        return;
      }

      // 2. Direct client fallback for static deployment (using safe chunked Base64 encoding)
      const filePath = "public/products.json";
      const authHeader = token.startsWith("ghp_") ? `token ${token}` : `Bearer ${token}`;

      // Get current SHA
      const getUrl = `https://api.github.com/repos/${cleanRepo}/contents/${filePath}?ref=${cleanBranch}`;
      const getRes = await fetch(getUrl, {
        headers: { Authorization: authHeader, Accept: "application/vnd.github.v3+json" }
      });

      let sha = "";
      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
      } else if (getRes.status === 401 || getRes.status === 403) {
        addToast("GitHub Token সঠিক নয় বা 'repo' পারমিশন নেই।", "error");
        setGithubConnectionInfo({ status: "error", message: "Token সঠিক নয় বা 'repo' পারমিশন নেই।" });
        return;
      } else if (getRes.status === 404) {
        const checkRepo = await fetch(`https://api.github.com/repos/${cleanRepo}`, {
          headers: { Authorization: authHeader, Accept: "application/vnd.github.v3+json" }
        });
        if (!checkRepo.ok) {
          addToast(`Repository '${cleanRepo}' খুঁজে পাওয়া যায়নি!`, "error");
          setGithubConnectionInfo({ status: "error", message: `Repository '${cleanRepo}' খুঁজে পাওয়া যায়নি!` });
          return;
        }
      }

      // Safe Base64 encoding via TextEncoder
      const jsonStr = JSON.stringify(adminProducts, null, 2);
      const bytes = new TextEncoder().encode(jsonStr);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      const base64Content = btoa(binary);

      // Put commit to GitHub
      const putUrl = `https://api.github.com/repos/${cleanRepo}/contents/${filePath}`;
      const putRes = await fetch(putUrl, {
        method: "PUT",
        headers: {
          Authorization: authHeader,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `chore(catalog): sync ${adminProducts.length} products via admin panel`,
          content: base64Content,
          sha: sha || undefined,
          branch: cleanBranch,
          committer: {
            name: "Nirapod Kroy Admin",
            email: "admin@nirapodkroy.shop"
          }
        })
      });

      if (putRes.ok) {
        const putData = await putRes.json();
        const commitUrl = putData.commit?.html_url || `https://github.com/${cleanRepo}/commits/${cleanBranch}`;
        const timeStr = new Date().toLocaleTimeString("bn-BD");
        setLastGithubCommitUrl(commitUrl);
        setLastGithubSyncTime(timeStr);
        localStorage.setItem("nirapod_gh_last_commit", commitUrl);
        localStorage.setItem("nirapod_gh_last_time", timeStr);

        try {
          const publicCatalog = adminProducts.filter(p => p.isActive !== false);
          localStorage.setItem("nirapod_products_cache", JSON.stringify(publicCatalog));
          window.dispatchEvent(new CustomEvent("nirapod-catalog-updated"));
        } catch {}
        onProductsUpdated();

        addToast("সফলভাবে GitHub-এ কমিট হয়েছে! ১ মিনিটের মধ্যে nirapodkroy.shop লাইভ আপডেট হবে।", "success");
      } else {
        const errData = await putRes.json().catch(() => ({}));
        let friendlyErr = errData.message || "Failed to commit";
        if (putRes.status === 409) friendlyErr = "GitHub Conflict: ফাইলের ভার্সন মেলেনি। আবার পুশ বাটনে ক্লিক করুন।";
        if (putRes.status === 404) friendlyErr = `Repository '${cleanRepo}' বা ব্রাঞ্চ '${cleanBranch}' পাওয়া যায়নি।`;
        addToast(`GitHub Error: ${friendlyErr}`, "error");
        setGithubConnectionInfo({ status: "error", message: friendlyErr });
      }
    } catch (err: any) {
      console.error(err);
      addToast(`GitHub Sync Error: ${err.message || "Network error"}`, "error");
      setGithubConnectionInfo({ status: "error", message: err.message || "Network error" });
    } finally {
      setIsPushingToGithub(false);
    }
  };

  useEffect(() => {
    if (isAdminModalOpen && isAdminLoggedIn) {
      fetchAdminData();
    }
  }, [isAdminModalOpen, isAdminLoggedIn]);

  // Sync admin products if products prop changes
  useEffect(() => {
    if (products && products.length > 0 && adminProducts.length === 0) {
      setAdminProducts(products);
    }
  }, [products]);

  // Clean close handler: if unsaved sync data is active in preview mode, clear it so it doesn't linger
  const handleCloseAdminModal = useCallback(() => {
    if (isLiveSheetMode && !isSyncedDataSaved) {
      setOrders([]);
      setCustomers([]);
      setSubscribers([]);
      setUserTracking([]);
      setTrackingStats({
        totalVisits: 0,
        activeNow: 0,
        pageStats: {},
        deviceStats: {},
        browserStats: {}
      });
      setStats(prev => prev ? {
        ...prev,
        totalRevenue: 0,
        calculatedRevenue: 0,
        isCustomRevenue: false,
        totalOrders: 0,
        syncedGoogleSheetsCount: 0
      } : null);
      setIsLiveSheetMode(false);
    }
    setIsAdminModalOpen(false);
  }, [isLiveSheetMode, isSyncedDataSaved, setIsAdminModalOpen]);

  // Admin Logout Handler
  const handleAdminLogout = useCallback(() => {
    if (isLiveSheetMode && !isSyncedDataSaved) {
      setOrders([]);
      setCustomers([]);
      setSubscribers([]);
      setUserTracking([]);
      setTrackingStats({
        totalVisits: 0,
        activeNow: 0,
        pageStats: {},
        deviceStats: {},
        browserStats: {}
      });
      setStats(null);
      setIsLiveSheetMode(false);
    }
    logoutAdmin();
  }, [isLiveSheetMode, isSyncedDataSaved, logoutAdmin]);

  // Listen for Escape key to cleanly close admin console for comfortable UX
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAdminModalOpen) {
        handleCloseAdminModal();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isAdminModalOpen, handleCloseAdminModal]);

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const success = await loginAdmin(adminPassword, adminEmail);
    setIsLoggingIn(false);
    if (success) {
      setAdminPassword("");
      setAdminEmail("");
    }
  };

  // Open Product Form for Add
  const handleOpenAddProduct = () => {
    stopCamera();
    setEditingProduct(null);
    setFormTitle("");
    setFormDescription("");
    setFormPrice("");
    setFormRegularPrice("");
    setCategoryClassification("main");
    setFormCategory("Groceries & Food");
    setFormParentCategory("");
    setCustomCategoryName("");
    setCustomParentCategoryName("");
    setIsCustomMainCategory(false);
    setIsCustomParentCategory(false);
    setFormStock("20");
    setFormImageUrl("");
    setFormImages([]);
    setLinkInputUrl("");
    setImageFileName("");
    setImageInputMode("device");
    setFormBadge("New");
    setFormFeatured(false);
    setFormIsActive(true);
    setFormIsOfferZone(false);
    setFormOfferDiscountNote("");
    setFormIsAffiliate(false);
    setFormAffiliateUrl("");
    setFormAffiliateSource("");
    setFormAffiliateButtonText("");
    setIsProductFormOpen(true);
  };

  // Open Product Form for Edit
  const handleOpenEditProduct = (prod: Product) => {
    stopCamera();
    setEditingProduct(prod);
    setFormTitle(prod.title);
    setFormDescription(prod.description);
    setFormPrice(String(prod.price));
    setFormRegularPrice(prod.regularPrice ? String(prod.regularPrice) : "");

    // Determine category hierarchy: Sub-category vs Main Category
    const parentCat = prod.parentCategory || getParentCategory(prod.category, products);
    if (parentCat) {
      setCategoryClassification("sub");
      setFormParentCategory(parentCat);
      setCustomParentCategoryName(parentCat);
      setFormCategory(prod.category || "");
      setCustomCategoryName(prod.category || "");
      setIsCustomParentCategory(false);
      setIsCustomMainCategory(false);
    } else {
      setCategoryClassification("main");
      setFormParentCategory("");
      setCustomParentCategoryName("");
      const isKnownMain = availableMainCategories.some(
        (c) => c.toLowerCase() === (prod.category || "").trim().toLowerCase()
      );
      if (isKnownMain) {
        setFormCategory(prod.category);
        setCustomCategoryName("");
        setIsCustomMainCategory(false);
      } else {
        setFormCategory(prod.category || "");
        setCustomCategoryName(prod.category || "");
        setIsCustomMainCategory(true);
      }
    }

    setFormStock(String(prod.stock));
    const existingImgs = (prod.images && prod.images.length > 0)
      ? prod.images
      : (prod.imageUrl ? [prod.imageUrl] : []);
    setFormImageUrl(prod.imageUrl || existingImgs[0] || "");
    setFormImages(existingImgs);
    setLinkInputUrl("");
    setImageFileName(prod.imageUrl.startsWith("data:") ? "Saved Image" : "");
    setImageInputMode(prod.imageUrl.startsWith("data:") ? "device" : "link");
    setFormBadge(prod.badge || "");
    setFormFeatured(Boolean(prod.featured));
    setFormIsActive(prod.isActive !== false);
    setFormIsOfferZone(Boolean(prod.isOfferZone));
    setFormOfferDiscountNote(prod.offerDiscountNote || "");
    setFormIsAffiliate(Boolean(prod.isAffiliate));
    setFormAffiliateUrl(prod.affiliateUrl || "");
    setFormAffiliateSource(prod.affiliateSource || "");
    setFormAffiliateButtonText(prod.affiliateButtonText || "");
    setIsProductFormOpen(true);
  };

  // Auto-detect platform from affiliate URL
  const handleAffiliateUrlChange = (url: string) => {
    setFormAffiliateUrl(url);
    const lower = url.toLowerCase();
    if (!formAffiliateSource || formAffiliateSource === "Daraz" || formAffiliateSource === "Amazon" || formAffiliateSource === "AliExpress" || formAffiliateSource === "Bikroy") {
      if (lower.includes("daraz")) {
        setFormAffiliateSource("Daraz");
        if (!formAffiliateButtonText || formAffiliateButtonText.includes("Buy") || formAffiliateButtonText.includes("কিনুন")) {
          setFormAffiliateButtonText("দারাজে সরাসরি অর্ডার করুন (Buy on Daraz)");
        }
      } else if (lower.includes("amazon")) {
        setFormAffiliateSource("Amazon");
        if (!formAffiliateButtonText || formAffiliateButtonText.includes("Buy")) {
          setFormAffiliateButtonText("Buy on Amazon ↗");
        }
      } else if (lower.includes("aliexpress")) {
        setFormAffiliateSource("AliExpress");
        if (!formAffiliateButtonText || formAffiliateButtonText.includes("Buy")) {
          setFormAffiliateButtonText("Buy on AliExpress ↗");
        }
      } else if (lower.includes("bikroy")) {
        setFormAffiliateSource("Bikroy");
        if (!formAffiliateButtonText || formAffiliateButtonText.includes("Buy")) {
          setFormAffiliateButtonText("বিক্রয়ে দেখুন (View on Bikroy)");
        }
      }
    }
  };

  // Submit Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formPrice) {
      addToast("Title and price are required", "warning");
      return;
    }

    if (formIsAffiliate && !formAffiliateUrl.trim()) {
      addToast("Please provide an Affiliate / External Product Link", "warning");
      return;
    }

    setIsSubmittingProduct(true);
    try {
      const finalImagesList = formImages.filter(Boolean);
      const primaryImg = (formImageUrl && formImageUrl.trim())
        ? formImageUrl.trim()
        : (finalImagesList[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80");

      const payloadImages = finalImagesList.length > 0
        ? (finalImagesList.includes(primaryImg) ? finalImagesList : [primaryImg, ...finalImagesList])
        : [primaryImg];

      let resolvedCategory = "";
      let resolvedParentCategory: string | undefined = undefined;

      if (categoryClassification === "sub") {
        resolvedCategory = (formCategory.trim() || customCategoryName.trim()) || "General";
        const parent = isCustomParentCategory ? customParentCategoryName.trim() : formParentCategory.trim();
        resolvedParentCategory = parent || "Groceries & Food";
      } else {
        resolvedCategory = (isCustomMainCategory
          ? customCategoryName.trim()
          : (formCategory === "__CUSTOM__" ? customCategoryName.trim() : formCategory.trim())
        ) || "Groceries & Food";
        resolvedParentCategory = undefined;
      }

      const payload: Partial<Product> = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        price: Number(formPrice),
        regularPrice: formRegularPrice ? Number(formRegularPrice) : undefined,
        category: resolvedCategory,
        parentCategory: resolvedParentCategory,
        stock: formIsAffiliate ? 999 : Number(formStock) || 0,
        imageUrl: primaryImg,
        images: payloadImages,
        badge: formBadge.trim() || undefined,
        featured: formFeatured,
        isActive: formIsActive,
        isOfferZone: formIsOfferZone,
        offerDiscountNote: formOfferDiscountNote ? formOfferDiscountNote.trim() : undefined,
        isAffiliate: formIsAffiliate,
        affiliateUrl: formIsAffiliate ? formAffiliateUrl.trim() : undefined,
        affiliateSource: formIsAffiliate ? (formAffiliateSource.trim() || "Online Partner") : undefined,
        affiliateButtonText: formIsAffiliate ? (formAffiliateButtonText.trim() || undefined) : undefined,
      };

      const endpoint = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await safeAdminFetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const savedProd: Product = data.product;

        // Optimistically update admin product list and public cache immediately
        const updatedList = editingProduct
          ? adminProducts.map((p) => (p.id === editingProduct.id ? savedProd : p))
          : [savedProd, ...adminProducts];

        setAdminProducts(updatedList);
        try {
          const publicCatalog = updatedList.filter((p) => p.isActive !== false);
          localStorage.setItem("nirapod_products_cache", JSON.stringify(publicCatalog));
          localStorage.setItem("nirapod_products_modified", String(Date.now()));
          window.dispatchEvent(new CustomEvent("nirapod-catalog-updated"));
        } catch {}

        // Auto sync to live backend
        safeAdminFetch("/api/admin/publish-live", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({ products: updatedList })
        }).catch(() => {});

        addToast(
          editingProduct
            ? "পণ্য সফলভাবে আপডেট ও সেভ হয়েছে (Product updated & saved)!"
            : "নতুন পণ্য তৈরি ও স্থায়ীভাবে সেভ হয়েছে (Product saved permanently)!",
          "success"
        );
        setIsProductFormOpen(false);
        onProductsUpdated();
        fetchAdminData();
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast(errData.error || "Failed to save product", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to save product", "error");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Instant Delete Product Trigger (Opens in-app confirmation modal, completely safe in iframes)
  const handleDeleteProduct = (id: string, title: string) => {
    setProductToDelete({ id, title });
  };

    // Confirmed Delete execution (Instant removal and permanent save)
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const { id, title } = productToDelete;
    setProductToDelete(null);

    // 1. Instant optimistic UI removal and cache update
    const remaining = adminProducts.filter((p) => p.id !== id);
    setAdminProducts(remaining);
    try {
      const publicCatalog = remaining.filter((p) => p.isActive !== false);
      localStorage.setItem("nirapod_products_cache", JSON.stringify(publicCatalog));
      localStorage.setItem("nirapod_products_modified", String(Date.now()));
      window.dispatchEvent(new CustomEvent("nirapod-catalog-updated"));
    } catch {}

    addToast(`"${title}" মুছে ফেলা হয়েছে এবং সেভ হয়েছে (Deleted & Saved)!`, "info");

    try {
      const res = await safeAdminFetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      // Auto sync remaining to live server
      safeAdminFetch("/api/admin/publish-live", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ products: remaining })
      }).catch(() => {});

      if (res.ok) {
        onProductsUpdated();
        fetchAdminData();
      } else {
        onProductsUpdated();
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      fetchAdminData();
      onProductsUpdated();
    }
  };

  // Toggle Active/Inactive status instantly with one-click save
  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    const nextState = !currentlyActive;

    // 1. Instant optimistic update in admin list and public store cache
    const updated = adminProducts.map((p) => (p.id === id ? { ...p, isActive: nextState } : p));
    setAdminProducts(updated);
    try {
      const publicCatalog = updated.filter((p) => p.isActive !== false);
      localStorage.setItem("nirapod_products_cache", JSON.stringify(publicCatalog));
      localStorage.setItem("nirapod_products_modified", String(Date.now()));
      window.dispatchEvent(new CustomEvent("nirapod-catalog-updated"));
    } catch {}

    addToast(
      nextState
        ? "পণ্যটি এখন Active (ওয়েবসাইটে সরাসরি লাইভ প্রদর্শিত হচ্ছে)"
        : "পণ্যটি এখন Inactive (ওয়েবসাইট থেকে নিরাপদে লুকানো হয়েছে)",
      "success"
    );

    try {
      const res = await safeAdminFetch(`/api/products/${id}/toggle-active`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      // Auto sync to live
      safeAdminFetch("/api/admin/publish-live", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ products: updated })
      }).catch(() => {});

      if (res.ok) {
        onProductsUpdated();
      }
    } catch (err) {
      console.error(err);
      fetchAdminData();
    }
  };

  // Toggle Offer Zone status instantly with one-click save
  const handleToggleOfferZone = async (id: string, currentlyInOfferZone: boolean) => {
    const nextState = !currentlyInOfferZone;

    // 1. Instant optimistic update in admin list and public store cache
    const updated = adminProducts.map((p) => (p.id === id ? { ...p, isOfferZone: nextState } : p));
    setAdminProducts(updated);
    try {
      const publicCatalog = updated.filter((p) => p.isActive !== false);
      localStorage.setItem("nirapod_products_cache", JSON.stringify(publicCatalog));
      localStorage.setItem("nirapod_products_modified", String(Date.now()));
      window.dispatchEvent(new CustomEvent("nirapod-catalog-updated"));
    } catch {}

    addToast(
      nextState
        ? "পণ্যটি অফার জোনে (Offer Zone) সফলভাবে যোগ করা হয়েছে! (মূল পেজেও থাকবে)"
        : "পণ্যটি অফার জোন থেকে সরানো হয়েছে (মূল ক্যাটাগরিতে যথারীতি থাকবে)।",
      "success"
    );

    try {
      const res = await safeAdminFetch(`/api/products/${id}/toggle-offer-zone`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      // Auto sync to live
      safeAdminFetch("/api/admin/publish-live", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ products: updated })
      }).catch(() => {});

      if (res.ok) {
        onProductsUpdated();
      }
    } catch (err) {
      console.error(err);
      fetchAdminData();
    }
  };

  // Open Revenue Edit Modal
  const handleOpenEditRevenue = () => {
    setCustomRevenueInput(stats?.totalRevenue !== undefined ? String(stats.totalRevenue) : "0");
    setIsEditingRevenue(true);
  };

  // Save Custom Total Revenue
  const handleSaveRevenue = async () => {
    const num = Number(customRevenueInput);
    if (isNaN(num) || num < 0) {
      addToast("সঠিক রেভিনিউ টাকার পরিমাণ দিন", "warning");
      return;
    }
    setIsSavingRevenue(true);
    try {
      const res = await safeAdminFetch("/api/admin/revenue", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ customTotalRevenue: num })
      });
      if (res.ok) {
        const data = await res.json();
        setStats(prev => prev ? {
          ...prev,
          totalRevenue: data.totalRevenue,
          isCustomRevenue: true,
          customTotalRevenue: data.totalRevenue,
          calculatedRevenue: data.calculatedRevenue
        } : null);
        addToast(data.message || "মোট রেভিনিউ সফলভাবে পরিবর্তন করা হয়েছে!", "success");
        setIsEditingRevenue(false);
      } else {
        addToast("রেভিনিউ পরিবর্তন করা যায়নি", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("রেভিনিউ সেভ করতে সমস্যা হয়েছে", "error");
    } finally {
      setIsSavingRevenue(false);
    }
  };

  // Reset Custom Revenue to Auto Calculation
  const handleResetRevenue = async () => {
    setIsSavingRevenue(true);
    try {
      const res = await safeAdminFetch("/api/admin/revenue", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ reset: true })
      });
      if (res.ok) {
        const data = await res.json();
        setStats(prev => prev ? {
          ...prev,
          totalRevenue: data.totalRevenue,
          isCustomRevenue: false,
          customTotalRevenue: undefined,
          calculatedRevenue: data.calculatedRevenue
        } : null);
        addToast(data.message || "মোট রেভিনিউ স্বয়ংক্রিয় গণনায় রিসেট করা হয়েছে।", "info");
        setIsEditingRevenue(false);
      }
    } catch (err) {
      console.error(err);
      addToast("রিসেট ব্যর্থ হয়েছে", "error");
    } finally {
      setIsSavingRevenue(false);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
        addToast(`Order ${orderId} marked as ${newStatus}`, "success");
      }
    } catch {
      addToast("Failed to update status", "error");
    }
  };

  // Update Order Tracking Details & Tracking Number (Syncs to Google Sheets & memory)
  const handleUpdateOrderTracking = async (orderId: string, trackingNumber?: string, orderTrackingDetails?: string, status?: string) => {
    setIsUpdatingTracking(prev => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/tracking`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          trackingNumber,
          orderTrackingDetails,
          status
        })
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(prev => prev.map(o => o.id === orderId ? {
          ...o,
          trackingNumber: trackingNumber || o.trackingNumber,
          orderTrackingDetails: orderTrackingDetails || o.orderTrackingDetails,
          trackingDetails: orderTrackingDetails || o.trackingDetails,
          ...(status ? { status: status as any } : {})
        } : o));
        addToast(data.message || "ট্র্যাকিং তথ্য সেভ ও গুগল শিটে আপডেট সম্পন্ন!", "success");
      } else {
        addToast("ট্র্যাকিং তথ্য আপডেট করতে সমস্যা হয়েছে", "error");
      }
    } catch {
      addToast("Failed to update tracking info", "error");
    } finally {
      setIsUpdatingTracking(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // Trigger Google Sheet Webhook Sync for Order
  const handleSyncOrderToSheets = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const data = await res.json();
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, syncedToGoogleSheet: true } : o));
        addToast(data.message || "Synced to Google Sheets!", "success");
      } else {
        addToast(data.message || "Failed to sync order", "error");
      }
    } catch {
      addToast("Sync failed", "error");
    }
  };

  // Delete Order (Admin panel only, retains Google Sheets data)
  const handleDeleteOrder = (order: Order) => {
    setOrderToDelete({ id: order.id, customerName: order.customerName, total: order.totalPrice });
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    const { id } = orderToDelete;
    setOrderToDelete(null);

    // Optimistically update order list
    const remainingOrders = orders.filter(o => o.id !== id);
    setOrders(remainingOrders);
    addToast(`অর্ডার #${id} অ্যাডমিন প্যানেল থেকে মুছে ফেলা হয়েছে (গুগল শিটের রেকর্ড অক্ষত রাখা হয়েছে)।`, "info");

    try {
      const res = await safeAdminFetch(`/api/admin/orders/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      fetchAdminData();
    }
  };

  // Delete Customer (Admin panel only, retains Google Sheets data)
  const handleDeleteCustomer = (cust: AdminCustomer) => {
    setCustomerToDelete({ id: cust.id, name: cust.name, email: cust.email });
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    const { id, name } = customerToDelete;
    setCustomerToDelete(null);

    // Optimistically update customer list
    const remainingCustomers = customers.filter(c => c.id !== id);
    setCustomers(remainingCustomers);
    addToast(`কাস্টমার "${name}" অ্যাডমিন প্যানেল থেকে মুছে ফেলা হয়েছে (গুগল শিটের রেকর্ড অক্ষত রাখা হয়েছে)।`, "info");

    try {
      const res = await safeAdminFetch(`/api/admin/customers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      fetchAdminData();
    }
  };

  // Delete Subscriber handler
  const handleDeleteSubscriber = async (email: string) => {
    try {
      setSubscribers(prev => prev.filter(s => s.email.toLowerCase() !== email.toLowerCase()));
      addToast(`সাবস্ক্রাইবার "${email}" মুছে ফেলা হয়েছে`, "info");
      const res = await safeAdminFetch(`/api/admin/subscribers/${encodeURIComponent(email)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      fetchAdminData();
    } finally {
      setSubscriberToDelete(null);
    }
  };

  // Export Subscribers to CSV
  const exportSubscribersToCsv = () => {
    if (subscribers.length === 0) {
      addToast("কোন সাবস্ক্রাইবার ডেটা নেই", "warning");
      return;
    }
    const headers = "Email,Source,SubscribedAt\n";
    const rows = subscribers.map(s => `"${s.email}","${s.source}","${s.subscribedAt}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nirapod-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("CSV ফাইল ডাউনলোড সম্পন্ন হয়েছে", "success");
  };

  // Sync Live Data from Google Sheets Hub (Pull-only preview mode)
  const handleSyncFromGoogleSheets = async () => {
    setIsSyncingFromSheets(true);
    try {
      const res = await safeAdminFetch("/api/admin/sync-from-sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ webhookUrl })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.orders)) setOrders(data.orders);
        if (Array.isArray(data.customers)) setCustomers(data.customers);
        if (Array.isArray(data.subscribers)) setSubscribers(data.subscribers);
        if (Array.isArray(data.tracking)) {
          setUserTracking(data.tracking);
          const pageCounts: Record<string, number> = {};
          const deviceCounts: Record<string, number> = {};
          const browserCounts: Record<string, number> = {};
          data.tracking.forEach((t: any) => {
            pageCounts[t.page] = (pageCounts[t.page] || 0) + 1;
            deviceCounts[t.device] = (deviceCounts[t.device] || 0) + 1;
            browserCounts[t.browser] = (browserCounts[t.browser] || 0) + 1;
          });
          setTrackingStats({
            totalVisits: data.tracking.length,
            activeNow: data.tracking.length > 0 ? Math.max(1, Math.min(data.tracking.length, 5)) : 0,
            pageStats: pageCounts,
            deviceStats: deviceCounts,
            browserStats: browserCounts
          });
        }
        if (data.stats) {
          setStats(data.stats);
        }

        setIsLiveSheetMode(true);
        setIsSyncedDataSaved(false);
        addToast(
          data.message || "গুগল শিট থেকে ডেটা সফলভাবে লোড হয়েছে! অ্যাডমিন প্যানেলে রাখতে চাইলে 'সেভ করুন' বাটনে চাপুন।",
          "info"
        );
      } else {
        addToast(data.error || "গুগল শিট থেকে ডেটা পড়তে ব্যর্থ হয়েছে।", "error");
      }
    } catch (err: any) {
      addToast(err?.message || "সিঙ্ক এরর", "error");
    } finally {
      setIsSyncingFromSheets(false);
    }
  };

  // Save synced preview data permanently into Admin Panel
  const handleSaveSyncedData = async () => {
    setIsSavingSyncedData(true);
    try {
      const res = await safeAdminFetch("/api/admin/save-synced-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          orders,
          customers,
          subscribers,
          tracking: userTracking
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsSyncedDataSaved(true);
        setIsLiveSheetMode(false);
        addToast(data.message || "অ্যাডমিন প্যানেলে ডেটা সফলভাবে সেভ করা হয়েছে!", "success");
        if (adminToken) {
          const statsRes = await safeAdminFetch("/api/admin/stats", {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            if (statsData?.stats) setStats(statsData.stats);
          }
        }
      } else {
        addToast(data.error || "ডেটা সেভ করতে ব্যর্থ হয়েছে।", "error");
      }
    } catch (err: any) {
      addToast(err?.message || "সেভ এরর", "error");
    } finally {
      setIsSavingSyncedData(false);
    }
  };

  // Clear saved data from Admin Panel (Google Sheets remains 100% safe & untouched)
  const handleClearSavedData = async () => {
    setIsClearingSavedData(true);
    try {
      const res = await safeAdminFetch("/api/admin/clear-saved-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders([]);
        setCustomers([]);
        setSubscribers([]);
        setUserTracking([]);
        setTrackingStats({
          totalVisits: 0,
          activeNow: 0,
          pageStats: {},
          deviceStats: {},
          browserStats: {}
        });
        setStats(prev => prev ? {
          ...prev,
          totalRevenue: 0,
          calculatedRevenue: 0,
          isCustomRevenue: false,
          totalOrders: 0,
          syncedGoogleSheetsCount: 0
        } : null);
        setIsSyncedDataSaved(false);
        setIsLiveSheetMode(false);
        setShowClearConfirmModal(false);
        addToast(
          data.message || "অ্যাডমিন প্যানেলের সংরক্ষিত ডেটা মুছে ফেলা হয়েছে (গুগল শিট অক্ষত রয়েছে)।",
          "success"
        );
      } else {
        addToast(data.error || "ডেটা মুছতে ব্যর্থ হয়েছে।", "error");
      }
    } catch (err: any) {
      addToast(err?.message || "মুছতে সমস্যা হয়েছে", "error");
    } finally {
      setIsClearingSavedData(false);
    }
  };

  // Discard preview without saving
  const handleDiscardPreview = () => {
    setOrders([]);
    setCustomers([]);
    setSubscribers([]);
    setUserTracking([]);
    setTrackingStats({
      totalVisits: 0,
      activeNow: 0,
      pageStats: {},
      deviceStats: {},
      browserStats: {}
    });
    setStats(prev => prev ? {
      ...prev,
      totalRevenue: 0,
      calculatedRevenue: 0,
      isCustomRevenue: false,
      totalOrders: 0,
      syncedGoogleSheetsCount: 0
    } : null);
    setIsLiveSheetMode(false);
    addToast("শিট প্রিভিউ ডেটা সরিয়ে নেওয়া হয়েছে।", "info");
  };

  // Save Webhook URL
  const handleSaveWebhook = async () => {
    setIsSavingWebhook(true);
    const cleanUrl = webhookUrl.trim();
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("nirapod_admin_settings", JSON.stringify({ webhookUrl: cleanUrl }));
      }

      let res: Response;
      try {
        res = await fetch("/api/admin/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify({ webhookUrl: cleanUrl })
        });
      } catch {
        res = await handleLocalApi("/api/admin/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify({ webhookUrl: cleanUrl })
        });
      }

      if (res.ok) {
        addToast("Google Sheets Webhook URL updated successfully", "success");
      } else {
        addToast("Failed to save webhook settings", "error");
      }
    } catch {
      addToast("Error saving webhook", "error");
    } finally {
      setIsSavingWebhook(false);
    }
  };

  // Test Order Webhook
  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    try {
      const res = await fetch("/api/admin/test-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ url: webhookUrl })
      });

      const data = await res.json();
      if (res.ok) {
        addToast(data.message || "টেস্ট অর্ডার সফলভাবে পাঠানো হয়েছে! গুগল শিটের Orders/Customer_Order_Tracking ট্যাবে চেক করুন।", "success");
      } else {
        addToast(data.error || "Webhook test failed. অনুগ্রহ করে আপনার স্ক্রিপ্ট ডিপ্লয়মেন্ট চেক করুন।", "error");
      }
    } catch {
      addToast("Webhook test failed.", "error");
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Test Subscribe Webhook
  const handleTestSubscribeWebhook = async () => {
    setIsTestingSubscribeWebhook(true);
    try {
      const res = await fetch("/api/admin/test-subscribe-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ url: webhookUrl })
      });

      const data = await res.json();
      if (res.ok) {
        addToast(data.message || "সাবস্ক্রাইব টেস্ট সফল! গুগল শিটের 'subscribe' ট্যাবে দেখুন।", "success");
      } else {
        addToast(data.error || "Subscribe Webhook test failed. নতুন ভার্সন ডিপ্লয় করা হয়েছে কিনা চেক করুন।", "error");
      }
    } catch {
      addToast("Subscribe Webhook test failed.", "error");
    } finally {
      setIsTestingSubscribeWebhook(false);
    }
  };

  // Test Live Email Alert
  const handleTestEmailAlert = async () => {
    setIsTestingEmailAlert(true);
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ url: webhookUrl, email: "adib1234@gmail.com" })
      });

      const data = await res.json();
      if (res.ok) {
        addToast(data.message || "টেস্ট অর্ডার নোটিফিকেশন adib1234@gmail.com এ পাঠানো হয়েছে! ইনবক্স বা স্প্যাম ফোল্ডার চেক করুন।", "success");
      } else {
        addToast(data.error || "Email alert test failed. অনুগ্রহ করে আপনার স্ক্রিপ্ট ডিপ্লয়মেন্ট চেক করুন।", "error");
      }
    } catch {
      addToast("Email alert test failed.", "error");
    } finally {
      setIsTestingEmailAlert(false);
    }
  };

  // Fetch Tracking Data
  const fetchTrackingData = useCallback(async () => {
    if (!adminToken) return;
    setIsLoadingTracking(true);
    try {
      const res = await safeAdminFetch("/api/admin/tracking", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserTracking(data.tracking || []);
        setTrackingStats({
          totalVisits: data.totalVisits || 0,
          activeNow: data.activeNow || 0,
          pageStats: data.pageStats || {},
          deviceStats: data.deviceStats || {},
          browserStats: data.browserStats || {}
        });
      }
    } catch (err) {
      console.warn("Tracking data fetch fallback:", err);
    } finally {
      setIsLoadingTracking(false);
    }
  }, [adminToken]);

  // Auto-refresh live visitor tracking every 4 seconds when tracking tab is open
  useEffect(() => {
    if (isAdminModalOpen && activeTab === "tracking" && adminToken) {
      fetchTrackingData();
      const pollTimer = setInterval(fetchTrackingData, 4000);
      return () => clearInterval(pollTimer);
    }
  }, [isAdminModalOpen, activeTab, adminToken, fetchTrackingData]);

  // Test User Tracking Webhook -> sends dummy log to "user traking" tab in Google Sheets
  const handleTestTrackingWebhook = async () => {
    setIsTestingTrackingWebhook(true);
    try {
      const res = await safeAdminFetch("/api/admin/tracking/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ url: webhookUrl })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast(data.message || "ট্র্যাকিং টেস্ট সফল! গুগল শিটের 'user traking' ট্যাবে দেখুন।", "success");
        fetchTrackingData();
      } else {
        addToast(data.error || "User Tracking test failed. স্ক্রিপ্ট ডিপ্লয়মেন্ট চেক করুন।", "error");
      }
    } catch {
      addToast("User Tracking test failed.", "error");
    } finally {
      setIsTestingTrackingWebhook(false);
    }
  };

  // Clean Order Sheet: removes tracking rows accidentally inserted into "order sheet" and moves them to "user traking"
  const handleCleanOrderSheet = async () => {
    setIsCleaningOrderSheet(true);
    try {
      const res = await safeAdminFetch("/api/admin/clean-order-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ url: webhookUrl })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast(data.message || "অর্ডার শিট থেকে ট্র্যাকিং ডেটা সফলভাবে 'user traking' ট্যাবে সরানো হয়েছে!", "success");
      } else {
        addToast(data.error || "ক্লিন অপারেশন সম্পন্ন করা সম্ভব হয়নি। গুগল স্ক্রিপ্ট আপডেট করুন।", "error");
      }
    } catch {
      addToast("ক্লিন অপারেশন সম্পন্ন করা সম্ভব হয়নি।", "error");
    } finally {
      setIsCleaningOrderSheet(false);
    }
  };

  // Fix Customers Sheet: fixes row 1 headers and removes misplaced order rows from Customers tab
  const handleFixCustomersSheet = async () => {
    setIsFixingCustomersSheet(true);
    try {
      const res = await safeAdminFetch("/api/admin/fix-customers-sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ url: webhookUrl })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast(data.message || "কাস্টমার শিটের হেডার ঠিক করা হয়েছে এবং ভুল অর্ডার রো সরানো হয়েছে!", "success");
      } else {
        addToast(data.error || "অপারেশন সম্পন্ন করা সম্ভব হয়নি। গুগল স্ক্রিপ্ট আপডেট করুন।", "error");
      }
    } catch {
      addToast("কাস্টমার শিট মেরামত করা সম্ভব হয়নি।", "error");
    } finally {
      setIsFixingCustomersSheet(false);
    }
  };

  // Export Tracking Logs to CSV
  const exportTrackingToCsv = () => {
    if (userTracking.length === 0) {
      addToast("ডাউনলোড করার মতো কোনো ট্র্যাকিং ডেটা নেই", "warning");
      return;
    }
    const headers = "Time,Page,IP,Location,Device,OS,Browser,TimeSpent,Referrer,Screen,SessionID\n";
    const rows = userTracking
      .map((t) =>
        [
          `"${t.time}"`,
          `"${t.page}"`,
          `"${t.ip}"`,
          `"${t.location}"`,
          `"${t.device}"`,
          `"${t.os}"`,
          `"${t.browser}"`,
          `"${t.timeSpent}"`,
          `"${t.referrer}"`,
          `"${t.screen}"`,
          `"${t.sessionId}"`
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nirapod-user-tracking-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("ইউজার ট্র্যাকিং CSV ফাইল ডাউনলোড সম্পন্ন হয়েছে", "success");
  };

  const sampleAppsScriptCode = `// ==========================================
// নিরপদ ক্রয় (Nirapod Kroy) - Master Google Sheets Webhook
// Tabs Supported: "order sheet", "user traking" (also "user tracking"), "subscribe", "Customers"
// ==========================================

// ⭐️ জিমেইল নোটিফিকেশন চালু করার জন্য একবার রান করুন:
// উপরে ফাংশন ড্রপডাউনে "authorizeAndTestEmail" সিলেক্ট করে ▶️ Run এ ক্লিক করুন।
// এরপর Google এর পপ-আপ আসলে "Review Permissions" -> "Allow" করে দিন।
function authorizeAndTestEmail() {
  var targetMail = "adib1234@gmail.com";
  try {
    MailApp.sendEmail({
      to: targetMail,
      subject: "✅ Nirapod Kroy Apps Script Email Authorization",
      htmlBody: "<div style='font-family: Arial; padding: 20px;'><h2>অভিনন্দন!</h2><p>আপনার গুগল শিটের Apps Script সফলভাবে জিমেইল পাঠানোর অনুমতি পেয়েছে। এখন থেকে নতুন কোনো অর্ডার সম্পন্ন হলে স্বয়ংক্রিয়ভাবে আপনার জিমেইলে অর্ডার তথ্য চলে আসবে।</p></div>"
    });
    Logger.log("Email sent successfully to " + targetMail);
  } catch (e) {
    Logger.log("Error sending test email: " + e.toString());
  }
}

// Helper: কেস-ইনসেনসিটিভ এবং বানানের তারতম্য সত্ত্বেও শিট খুঁজে বের করার ফাংশন (অর্ডার ও কাস্টমার সম্পূর্ণ আলাদা রাখার জন্য এক্সক্লুশন সাপোর্টসহ)
function findSheet(ss, candidates, keyword, exclude1, exclude2) {
  var sheets = ss.getSheets();
  // ১. হুবহু নাম চেক (ছোট/বড় হাতের অক্ষর বা স্পেস অগ্রাহ্য করে)
  for (var i = 0; i < sheets.length; i++) {
    var sName = sheets[i].getName().trim().toLowerCase();
    if (exclude1 && sName.indexOf(exclude1.toLowerCase().trim()) !== -1) continue;
    if (exclude2 && sName.indexOf(exclude2.toLowerCase().trim()) !== -1) continue;
    for (var j = 0; j < candidates.length; j++) {
      if (sName === candidates[j].toLowerCase().trim()) {
        return sheets[i];
      }
    }
  }
  // ২. কিওয়ার্ড চেক
  if (keyword) {
    var kw = keyword.toLowerCase().trim();
    for (var i = 0; i < sheets.length; i++) {
      var sName = sheets[i].getName().trim().toLowerCase();
      if (exclude1 && sName.indexOf(exclude1.toLowerCase().trim()) !== -1) continue;
      if (exclude2 && sName.indexOf(exclude2.toLowerCase().trim()) !== -1) continue;
      if (sName.indexOf(kw) !== -1) {
        return sheets[i];
      }
    }
  }
  return null;
}

// 1. ডেটা পড়ার জন্য (GET Request - Live Google Sheets Sync)
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // ম্যানুয়াল ক্লিনআপ রিকোয়েস্ট হ্যান্ডলিং (?action=clean_order_sheet)
    if (e && e.parameter && e.parameter.action === "clean_order_sheet") {
      var cleanMsg = cleanOrderSheetTrackingRows();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: cleanMsg }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // কাস্টমার শিট হেডার ফিক্স ও ক্লিনআপ (?action=fix_customers)
    if (e && e.parameter && (e.parameter.action === "fix_customers" || e.parameter.action === "clean_customers")) {
      var fixCustMsg = fixAndCleanCustomersSheet();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: fixCustMsg }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var result = { orders: [], customers: [], subscribers: [], tracking: [] };
    
    // 1. Orders tab ("order sheet" বা "Orders" - কাস্টমার শিট সম্পূর্ণ বাদ)
    var orderSheet = findSheet(ss, ["order sheet", "Order Sheet", "Orders", "orders", "অর্ডার_লিস্ট", "অর্ডার"], "order", "custom", "coustom");
    if (orderSheet && orderSheet.getLastRow() > 1) {
      var lastCol = Math.min(orderSheet.getLastColumn(), 16);
      var rows = orderSheet.getRange(2, 1, orderSheet.getLastRow() - 1, lastCol).getValues();
      result.orders = rows
        .filter(function(r) {
          // ট্র্যাকিংয়ের ভুল রো বাদ দিয়ে শুধু আসল অর্ডার ফিল্টার
          var colA = String(r[0] || "");
          var colB = String(r[1] || "");
          return colA.indexOf("NK-") !== -1 || colA.indexOf("ORD-") !== -1 || colB.indexOf("হোমপেজ") === -1;
        })
        .map(function(r) {
          return {
            id: String(r[0] || ""),
            createdAt: String(r[1] || ""),
            customerName: String(r[2] || ""),
            customerEmail: String(r[3] || ""),
            customerPhone: String(r[4] || ""),
            shippingAddress: String(r[5] || ""),
            itemsText: String(r[6] || ""),
            totalPrice: String(r[7] || ""),
            paymentMethod: String(r[8] || ""),
            status: String(r[9] || "Pending"),
            productCodes: String(r[10] || ""),
            trackingNumber: String(r[11] || ""),
            orderTrackingDetails: String(r[12] || ""),
            trackingDetails: String(r[12] || "")
          };
        });
    }

    // 2. Subscribers tab ("subscribe")
    var subSheet = findSheet(ss, ["subscribe", "Subscribe", "Subscribers", "সাবস্ক্রাইব"], "subscrib", "order", "custom");
    if (subSheet && subSheet.getLastRow() > 1) {
      var sRows = subSheet.getRange(2, 1, subSheet.getLastRow() - 1, Math.min(subSheet.getLastColumn(), 4)).getValues();
      result.subscribers = sRows.map(function(r) {
        return {
          date: String(r[0] || ""),
          email: String(r[1] || ""),
          source: String(r[2] || ""),
          status: String(r[3] || "Active")
        };
      });
    }

    // 3. User Tracking tab ("user traking" বা "user tracking")
    var trackSheet = findSheet(ss, ["user traking", "user tracking", "User Traking", "User Tracking"], "trak", "order", "custom") || findSheet(ss, [], "track", "order", "custom");
    if (trackSheet && trackSheet.getLastRow() > 1) {
      var maxRowsToRead = Math.min(trackSheet.getLastRow() - 1, 200);
      var tRows = trackSheet.getRange(2, 1, maxRowsToRead, 11).getValues();
      result.tracking = tRows.map(function(r) {
        return {
          time: String(r[0] || ""),
          page: String(r[1] || ""),
          ip: String(r[2] || ""),
          location: String(r[3] || ""),
          device: String(r[4] || ""),
          os: String(r[5] || ""),
          browser: String(r[6] || ""),
          timeSpent: String(r[7] || ""),
          referrer: String(r[8] || ""),
          screen: String(r[9] || ""),
          sessionId: String(r[10] || "")
        };
      });
    }

    // 4. Customers tab ("Customers" বা "coustomer sheet" বা "গ্রাহক" - অর্ডার শিট সম্পূর্ণ বাদ)
    var custSheet = findSheet(ss, ["Customers", "customers", "Customer", "customer", "coustomer sheet", "customer sheet", "coustomer", "গ্রাহক_নিবন্ধন", "গ্রাহক"], "custom", "order") ||
                    findSheet(ss, ["coustomer sheet", "coustomer"], "coustom", "order");
    if (custSheet && custSheet.getLastRow() > 1) {
      var maxCustRows = Math.min(custSheet.getLastRow() - 1, 500);
      var cRows = custSheet.getRange(2, 1, maxCustRows, Math.min(custSheet.getLastColumn(), 7)).getValues();
      result.customers = cRows.map(function(r) {
        return {
          id: String(r[0] || ""),
          registeredAt: String(r[1] || ""),
          name: String(r[2] || ""),
          phone: String(r[3] || ""),
          email: String(r[4] || ""),
          address: String(r[5] || ""),
          password: String(r[6] || "")
        };
      });
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 2. নতুন ডেটা যুক্ত করার জন্য (POST Request)
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // ২০ সেকেন্ড লক নিয়ে একাধিক রিকোয়েস্ট একসাথে এলেও ডুপ্লিকেট এড়ানো
    try { lock.waitLock(20000); } catch(le) {}

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = {};
    
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (pe) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // অর্ডার শিট ও ট্র্যাকিং ক্লিন করার স্পেশাল কমান্ড
    if (data.action === "clean_order_sheet" || (e && e.parameter && e.parameter.action === "clean_order_sheet")) {
      var cleanMsg = cleanOrderSheetTrackingRows();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: cleanMsg }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // কাস্টমার শিট হেডার ঠিক করা ও ক্লিনআপ করার স্পেশাল কমান্ড
    if (data.action === "fix_customers" || data.action === "clean_customers" || (e && e.parameter && (e.parameter.action === "fix_customers" || e.parameter.action === "clean_customers"))) {
      var fixCustMsg = fixAndCleanCustomersSheet();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: fixCustMsg }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // ১. ইউজার ট্র্যাকিং ডেটা নিখুঁতভাবে শনাক্তকরণ (user traking / user tracking)
    var isTracking = Boolean(
      data.action === "user_tracking" || 
      data.action === "user_traking" || 
      data.type === "user_tracking" ||
      data.type === "user_traking" ||
      String(data.sheetTab || data.targetSheet || "").toLowerCase().indexOf("trak") !== -1 ||
      String(data.sheetTab || data.targetSheet || "").toLowerCase().indexOf("track") !== -1 ||
      (e && e.parameter && (
        String(e.parameter.tab || "").toLowerCase().indexOf("trak") !== -1 ||
        String(e.parameter.tab || "").toLowerCase().indexOf("track") !== -1 ||
        String(e.parameter.type || "").toLowerCase().indexOf("tracking") !== -1 ||
        String(e.parameter.action || "").toLowerCase().indexOf("tracking") !== -1
      )) ||
      (data.sheetRow && data.sheetRow.length === 11) ||
      Boolean(data.sessionId && (data.page || data.timeSpent))
    );

    // ২. সাবস্ক্রাইবার বা নিউজলেটার নির্ধারণ
    var isSubscriber = !isTracking && Boolean(
      data.action === "subscribe" || 
      data.action === "newsletter_subscription" || 
      data.type === "subscriber" ||
      String(data.sheetTab || data.targetSheet || "").toLowerCase().indexOf("subscrib") !== -1 ||
      (e && e.parameter && String(e.parameter.tab || "").toLowerCase().indexOf("subscrib") !== -1) ||
      (data.sheetRow && data.sheetRow.length === 4 && String(data.sheetRow[1]).indexOf("@") !== -1)
    );

    // ৩. গ্রাহক রেজিস্ট্রেশন চেক (শুধুমাত্র নতুন অ্যাকাউন্ট সাইন-আপ, অর্ডার কখনোই নয়!)
    var isCustomer = !isTracking && !isSubscriber && Boolean(
      data.action === "customer_registration" || 
      data.type === "customer" ||
      (e && e.parameter && (
        e.parameter.type === "customer" || 
        e.parameter.action === "customer_registration" ||
        (e.parameter.tab && (e.parameter.tab.toLowerCase().indexOf("custom") !== -1 || e.parameter.tab.toLowerCase().indexOf("coustom") !== -1))
      )) ||
      (data.sheetRow && data.sheetRow.length === 7 && String(data.sheetRow[0]).toLowerCase().indexOf("cust-") !== -1) ||
      Boolean(data.customerId && (data.password || data.registeredAt))
    );

    // ৪. অর্ডার চেক (সরাসরি এবং নিশ্চিতভাবে order sheet এ যাবে, কাস্টমার শিটে কখনোই নয়)
    var isOrder = !isTracking && !isSubscriber && !isCustomer && Boolean(
      data.action === "new_order" ||
      data.action === "order" ||
      data.type === "order" ||
      data.orderId ||
      String(data.sheetTab || data.targetSheet || "").toLowerCase().indexOf("order") !== -1 ||
      (e && e.parameter && (
        String(e.parameter.tab || "").toLowerCase().indexOf("order") !== -1 ||
        String(e.parameter.action || "").toLowerCase().indexOf("order") !== -1 ||
        String(e.parameter.type || "").toLowerCase().indexOf("order") !== -1 ||
        e.parameter.orderId
      )) ||
      Boolean(data.orderedItems || data.totalPrice || data.shippingAddress)
    );

    // ===============================================
    // ১. নতুন অর্ডার -> strictly "order sheet" ট্যাবে
    // ===============================================
    if (isOrder) {
      var orderSheet = findSheet(ss, ["order sheet", "Order Sheet", "Orders", "orders", "অর্ডার"], "order", "custom", "coustom") || 
                       ss.getSheetByName("order sheet") || 
                       ss.insertSheet("order sheet");
      if (orderSheet.getLastRow() === 0) {
        orderSheet.appendRow([
          "Order ID", "Date/Time", "Customer Name", "Customer Email", 
          "Customer Phone", "Shipping Address", "Ordered Items", 
          "Total Price", "Payment Method", "Status", "Product Code", "Tracking Number",
          "Order Tracking Details", "Send Money Number", "Tranzation Number", "Payment Provider"
        ]);
        orderSheet.getRange(1, 1, 1, 16).setFontWeight("bold").setBackground("#e6f4ea");
      }
      var ordRow = data.sheetRow;
      if (!ordRow || ordRow.length < 10) {
        ordRow = [
          data.orderId || ("NK-" + new Date().getTime()),
          data.orderDate || data.timestamp || new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
          data.customerName || "Customer",
          data.customerEmail || "",
          data.customerPhone || "",
          data.shippingAddress || "",
          data.orderedItems || "",
          data.totalPrice || "৳0",
          data.paymentMethod || "Cash on Delivery",
          data.orderStatus || "Pending",
          data.productCodes || data.productCode || "",
          data.trackingNumber || "",
          data.orderTrackingDetails || data.trackingDetails || data.orderTrackingDetis || "অর্ডার কনফার্মেশন সম্পন্ন হয়েছে",
          data.senderPhoneNumber || data.sendMoneyNumber || data.senderPhone || "",
          data.transactionId || data.tranzationNumber || "",
          data.paymentProvider || data.paymentBy || (data.paymentMethod && data.paymentMethod.indexOf("bKash") !== -1 ? "bKash" : (data.paymentMethod && data.paymentMethod.indexOf("Nagad") !== -1 ? "Nagad" : (data.paymentMethod && data.paymentMethod.indexOf("Rocket") !== -1 ? "Rocket" : "Cash on Delivery")))
        ];
      }

      // অর্ডার ডুপ্লিকেট চেক (Order ID দিয়ে)
      var targetOrderId = String(ordRow[0] || data.orderId || "").trim();
      var orderRowIndex = -1;
      if (orderSheet.getLastRow() > 1 && targetOrderId) {
        var existingOrders = orderSheet.getRange(2, 1, orderSheet.getLastRow() - 1, 1).getValues();
        for (var o = 0; o < existingOrders.length; o++) {
          if (String(existingOrders[o][0]).trim() === targetOrderId) {
            orderRowIndex = o + 2;
            break;
          }
        }
      }
      if (orderRowIndex !== -1) {
        // অর্ডার আগে থাকলে রো আপডেট করুন (যাতে ট্র্যাকিং ও স্ট্যাটাস পরিবর্তন শিটে সিঙ্ক হয়)
        orderSheet.getRange(orderRowIndex, 1, 1, ordRow.length).setValues([ordRow]);
      } else {
        orderSheet.appendRow(ordRow);

        // 📧 তাৎক্ষণিক লাইভ জিমেইল নোটিফিকেশন (Instant Live Gmail Notification)
        try {
          var adminEmails = ["adib1234@gmail.com", "adib1234w@gmail.com"];
          if (data.adminNotifyEmail) {
            var customList = String(data.adminNotifyEmail).split(",");
            for (var c = 0; c < customList.length; c++) {
              var cEmail = customList[c].trim();
              if (cEmail && adminEmails.indexOf(cEmail) === -1) adminEmails.push(cEmail);
            }
          }
          if (e && e.parameter && e.parameter.notifyEmail) {
            var paramList = String(e.parameter.notifyEmail).split(",");
            for (var p = 0; p < paramList.length; p++) {
              var pEmail = paramList[p].trim();
              if (pEmail && adminEmails.indexOf(pEmail) === -1) adminEmails.push(pEmail);
            }
          }

          var mailSubject = "🚨 নতুন লাইভ অর্ডার! #" + targetOrderId + " - " + (data.totalPrice || ordRow[7] || "") + " (" + (data.customerName || ordRow[2] || "গ্রাহক") + ")";
          var mailHtml = 
            '<div style="font-family: Arial, Helvetica, sans-serif; max-width: 650px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">' +
              '<div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 18px 24px; border-radius: 12px; color: #ffffff; text-align: center; margin-bottom: 20px;">' +
                '<h2 style="margin: 0; font-size: 22px; font-weight: bold;">🛒 নতুন অর্ডার নোটিফিকেশন (Live Alert)</h2>' +
                '<p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.95;">Nirapod Kroy ই-কমার্স শপ থেকে সরাসরি প্রেরিত</p>' +
              '</div>' +
              '<p style="font-size: 15px; color: #334155; margin-bottom: 16px;">আপনার ওয়েবসাইটে একটি নতুন অর্ডার সম্পন্ন হয়েছে:</p>' +
              '<table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #1e293b; margin-bottom: 20px;">' +
                '<tr style="background-color: #f8fafc;"><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold; width: 35%;">অর্ডার আইডি:</td><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold; color: #059669; font-size: 15px;">#' + targetOrderId + '</td></tr>' +
                '<tr><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold;">গ্রাহকের নাম:</td><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: 600;">' + (data.customerName || ordRow[2] || "") + '</td></tr>' +
                '<tr style="background-color: #f8fafc;"><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold;">মোবাইল নম্বর:</td><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold; color: #2563eb; font-size: 15px;"><a href="tel:' + (data.customerPhone || ordRow[4] || "") + '" style="color: #2563eb; text-decoration: none;">' + (data.customerPhone || ordRow[4] || "") + '</a></td></tr>' +
                '<tr><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold;">ইমেইল ঠিকানা:</td><td style="padding: 10px 14px; border: 1px solid #e2e8f0;">' + (data.customerEmail || ordRow[3] || "প্রদান করা হয়নি") + '</td></tr>' +
                '<tr style="background-color: #f8fafc;"><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold;">ডেলিভারি এরিয়া ও ঠিকানা:</td><td style="padding: 10px 14px; border: 1px solid #e2e8f0;">' + (data.shippingAddress || ordRow[5] || "") + '</td></tr>' +
                '<tr><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold;">অর্ডারকৃত প্রোডাক্ট ও ছবি কোড:</td><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">' + (data.orderedItems || ordRow[6] || "") + '</td></tr>' +
                '<tr style="background-color: #f8fafc;"><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold;">প্রোডাক্ট / ছবি কোড:</td><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #d97706;">' + (data.productCodes || data.productCode || (ordRow.length > 10 ? ordRow[10] : "") || "P-01") + '</td></tr>' +
                '<tr><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold;">সর্বমোট বিল (Total):</td><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-size: 16px; font-weight: bold; color: #dc2626;">' + (data.totalPrice || ordRow[7] || "") + '</td></tr>' +
                '<tr style="background-color: #f8fafc;"><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold;">পেমেন্ট মেথড:</td><td style="padding: 10px 14px; border: 1px solid #e2e8f0;">' + (data.paymentMethod || ordRow[8] || "Cash on Delivery") + '</td></tr>' +
                '<tr><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold; color: #059669;">Payment By:</td><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold; color: #059669;">' + (data.paymentBy || data.paymentProvider || (ordRow.length > 14 ? ordRow[14] : "") || (data.paymentMethod && data.paymentMethod.indexOf("bKash") !== -1 ? "bKash" : (data.paymentMethod && data.paymentMethod.indexOf("Nagad") !== -1 ? "Nagad" : (data.paymentMethod && data.paymentMethod.indexOf("Rocket") !== -1 ? "Rocket" : "Cash on Delivery")))) + '</td></tr>' +
                (data.senderPhoneNumber || data.sendMoneyNumber || (ordRow.length > 12 && ordRow[12] && ordRow[12] !== "N/A") ? '<tr style="background-color: #f8fafc;"><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold;">Send Money Number:</td><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #2563eb;">' + (data.senderPhoneNumber || data.sendMoneyNumber || ordRow[12]) + '</td></tr>' : '') +
                (data.transactionId || (ordRow.length > 13 && ordRow[13] && ordRow[13] !== "N/A") ? '<tr><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold;">Transaction Number (TrxID):</td><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #d97706;">' + (data.transactionId || ordRow[13]) + '</td></tr>' : '') +
                '<tr style="background-color: #f8fafc;"><td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: bold;">অর্ডারের সময়:</td><td style="padding: 10px 14px; border: 1px solid #e2e8f0; color: #64748b;">' + (data.orderDate || ordRow[1] || "") + '</td></tr>' +
              '</table>' +
              '<div style="background-color: #f1f5f9; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #475569; text-align: center;">' +
                'এই অর্ডারটি গুগল শিটের <b style="color: #059669;">"order sheet"</b> ট্যাবে এবং ওয়েবসাইট অ্যাডমিন প্যানেলে স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়েছে।' +
              '</div>' +
            '</div>';

          for (var idx = 0; idx < adminEmails.length; idx++) {
            var targetMail = adminEmails[idx].trim();
            if (targetMail && targetMail.indexOf("@") !== -1) {
              try {
                MailApp.sendEmail({
                  to: targetMail,
                  subject: mailSubject,
                  htmlBody: mailHtml
                });
              } catch(singleMailErr) {
                try {
                  MailApp.sendEmail(
                    targetMail,
                    mailSubject,
                    "নতুন অর্ডার #" + targetOrderId + "\nগ্রাহক: " + (data.customerName || ordRow[2]) + "\nফোন: " + (data.customerPhone || ordRow[4]) + "\nঠিকানা: " + (data.shippingAddress || ordRow[5]) + "\nআইটেম: " + (data.orderedItems || ordRow[6]) + "\nমোট: " + (data.totalPrice || ordRow[7])
                  );
                } catch(textErr) {}
              }
            }
          }
        } catch(emailErr) {
          // ইমেইল পাঠাতে কোনো সমস্যা হলেও গুগল শিটে ডেটা সেভ হওয়া বন্ধ হবে না
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        target: orderSheet.getName(),
        updatedExisting: orderUpdated
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ===============================================
    // ২. ইউজার ট্র্যাকিং -> শুধুমাত্র "user traking" ট্যাবে
    // ===============================================
    else if (isTracking) {
      var trackSheet = findSheet(ss, ["user traking", "user tracking", "User Traking", "User Tracking"], "trak") || 
                       findSheet(ss, [], "track");
      if (!trackSheet) {
        trackSheet = ss.insertSheet("user traking");
      }
      
      // হেডার না থাকলে বা কলাম কম থাকলে হেডার যুক্ত করা
      if (trackSheet.getLastRow() === 0 || trackSheet.getLastColumn() < 11) {
        if (trackSheet.getLastRow() === 0) {
          trackSheet.appendRow([
            "তারিখ ও সময় (Time)", 
            "পেজ (Page)", 
            "আইপি (IP)", 
            "লোকেশন (Location)", 
            "ডিভাইস (Device)", 
            "অপারেটিং সিস্টেম (OS)", 
            "ব্রাউজার (Browser)", 
            "সাইটে থাকার সময় (Time Spent)", 
            "কোথা থেকে এসেছে (Referrer)", 
            "স্ক্রিন রেজুলেশন (Screen)", 
            "সেশন আইডি (Session ID)"
          ]);
          trackSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#d0e1fd");
        }
      }

      var sessionId = String(data.sessionId || (data.sheetRow && data.sheetRow[10]) || "").trim();
      var timeSpent = String(data.timeSpent || (data.sheetRow && data.sheetRow[7]) || "সক্রিয় রয়েছে (Active)...").trim();
      var updated = false;

      // সেশন আইডি দিয়ে আগের রো খুঁজে সময় আপডেট (হৃদস্পন্দন / Heartbeat Update)
      if (sessionId && trackSheet.getLastRow() > 1 && trackSheet.getLastColumn() >= 11) {
        var lastRow = trackSheet.getLastRow();
        var searchRangeCount = Math.min(lastRow - 1, 150);
        var startRow = Math.max(2, lastRow - searchRangeCount + 1);
        var sessionValues = trackSheet.getRange(startRow, 11, searchRangeCount, 1).getValues();
        
        for (var i = sessionValues.length - 1; i >= 0; i--) {
          if (String(sessionValues[i][0]).trim() === sessionId) {
            var targetRowIndex = startRow + i;
            if (trackSheet.getLastColumn() >= 8) {
              trackSheet.getRange(targetRowIndex, 8).setValue(timeSpent);
            }
            updated = true;
            break;
          }
        }
      }

      // নতুন ভিজিটর হলে নতুন রো যোগ
      if (!updated) {
        var rowToAppend = data.sheetRow;
        if (!rowToAppend || rowToAppend.length < 11) {
          rowToAppend = [
            data.time || new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
            data.page || "হোমপেজ (Home)",
            data.ip || "Unknown",
            data.location || "Bangladesh",
            data.device || "Desktop / PC",
            data.os || "Windows 10/11",
            data.browser || "Chrome",
            timeSpent,
            data.referrer || "সরাসরি (Direct)",
            data.screen || "1920x1080",
            sessionId || ("v_" + new Date().getTime())
          ];
        }
        trackSheet.appendRow(rowToAppend);
      }

      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        target: trackSheet.getName(),
        updatedExisting: updated 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ===============================================
    // ৩. নিউজলেটার / সাবস্ক্রাইবার -> strictly "subscribe" ট্যাবে
    // ===============================================
    else if (isSubscriber) {
      var subSheet = findSheet(ss, ["subscribe", "Subscribe", "Subscribers", "সাবস্ক্রাইব"], "subscrib");
      if (!subSheet) {
        subSheet = ss.insertSheet("subscribe");
      }
      if (subSheet.getLastRow() === 0) {
        subSheet.appendRow(["Subscription Date", "Email", "Source", "Status"]);
        subSheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#fff3cd");
      }

      var targetEmail = String(data.email || (data.sheetRow && data.sheetRow[1]) || "").trim().toLowerCase();
      var isDuplicate = false;
      if (subSheet.getLastRow() > 1 && targetEmail) {
        var existingEmails = subSheet.getRange(2, 2, subSheet.getLastRow() - 1, 1).getValues();
        for (var s = 0; s < existingEmails.length; s++) {
          if (String(existingEmails[s][0]).trim().toLowerCase() === targetEmail) {
            isDuplicate = true;
            break;
          }
        }
      }

      if (!isDuplicate) {
        var rowToAppend = data.sheetRow;
        if (!rowToAppend || rowToAppend.length < 4) {
          rowToAppend = [
            data.date || new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
            targetEmail,
            data.source || "Website Footer",
            "Active"
          ];
        }
        subSheet.appendRow(rowToAppend);
      }

      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        target: subSheet.getName(),
        duplicate: isDuplicate 
      })).setMimeType(ContentService.MimeType.JSON);
    } 

    // ===============================================
    // ৪. গ্রাহক নিবন্ধন -> strictly "Customers" ট্যাবে
    // ===============================================
    else if (isCustomer) {
      var customerSheet = findSheet(ss, ["Customers", "customers", "Customer", "customer", "coustomer sheet", "customer sheet", "coustomer", "গ্রাহক_নিবন্ধন"], "custom", "order") ||
                          findSheet(ss, ["coustomer sheet", "coustomer"], "coustom", "order") ||
                          ss.getSheetByName("Customers") ||
                          ss.getSheetByName("coustomer sheet") ||
                          ss.insertSheet("Customers");
      if (customerSheet.getLastRow() === 0) {
        customerSheet.appendRow([
          "Customer ID", "Registration Date", "Name", "Phone", "Email", "Address", "Password"
        ]);
        customerSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#d1e7dd");
      }
      var custRow = data.sheetRow;
      if (!custRow || custRow.length < 7) {
        custRow = [
          data.customerId || ("cust-" + new Date().getTime()),
          data.registeredAt || new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
          data.name || "Customer",
          data.phone || "N/A",
          data.email || "",
          data.address || "N/A",
          data.password || ""
        ];
      }

      // কাস্টমার ডুপ্লিকেট চেক (ইমেইল দিয়ে)
      var targetEmail = String(custRow[4] || data.email || "").trim().toLowerCase();
      var custUpdated = false;
      if (customerSheet.getLastRow() > 1 && targetEmail) {
        var existingCusts = customerSheet.getRange(2, 5, customerSheet.getLastRow() - 1, 1).getValues();
        for (var c = 0; c < existingCusts.length; c++) {
          if (String(existingCusts[c][0]).trim().toLowerCase() === targetEmail) {
            customerSheet.getRange(c + 2, 1, 1, custRow.length).setValues([custRow]);
            custUpdated = true;
            break;
          }
        }
      }
      if (!custUpdated) {
        customerSheet.appendRow(custRow);
      }

      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        type: "customer",
        target: customerSheet.getName(),
        updatedExisting: custUpdated
      })).setMimeType(ContentService.MimeType.JSON);
    } 

    // ===============================================
    // ৫. অন্যান্য ডেটা ফলব্যাক
    // ===============================================
    else {
      // যদি কোনো কারণে মিস হয় কিন্তু অর্ডার সংক্রান্ত ফিল্ড থাকে তবে নিশ্চিতভাবে orderSheet এ যাবে (কখনোই কাস্টমার বা ট্র্যাকিংয়ে যাবে না)
      if (data.orderId || data.totalPrice || (data.sheetRow && data.sheetRow.length >= 10)) {
        var safeOrdSheet = findSheet(ss, ["order sheet", "Order Sheet", "Orders"], "order", "custom", "coustom") || 
                           ss.getSheetByName("order sheet") || 
                           ss.insertSheet("order sheet");
        safeOrdSheet.appendRow(data.sheetRow || [data.orderId || ("NK-" + new Date().getTime()), new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })]);
        return ContentService.createTextOutput(JSON.stringify({ 
          status: "success", 
          type: "order", 
          target: safeOrdSheet.getName() 
        })).setMimeType(ContentService.MimeType.JSON);
      }
      var fallbackSheet = ss.getSheetByName("order sheet") || ss.getSheets()[0];
      if (data.sheetRow) {
        fallbackSheet.appendRow(data.sheetRow);
      }
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "fallback", 
        target: fallbackSheet.getName() 
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    try { lock.releaseLock(); } catch(le) {}
  }
}

// ==========================================
// ৩. অর্ডার শিট ও ট্র্যাকিং ডুপ্লিকেট ক্লিনআপ ফাংশন
// এটি চালালে অর্ডার শিটে ভুল করে ঢুকে যাওয়া ট্র্যাকিং রো এবং ডুপ্লিকেট অর্ডার ক্লিন হয়ে যাবে
// ==========================================
function cleanOrderSheetTrackingRows() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var orderSheet = findSheet(ss, ["order sheet", "Order Sheet", "Orders", "orders", "অর্ডার"], "order", "custom", "coustom") || ss.getSheetByName("order sheet");
  var trackSheet = findSheet(ss, ["user traking", "user tracking"], "trak", "order", "custom") || findSheet(ss, [], "track", "order", "custom") || ss.insertSheet("user traking");
  
  if (trackSheet.getLastRow() === 0) {
    trackSheet.appendRow([
      "তারিখ ও সময় (Time)", "পেজ (Page)", "আইপি (IP)", "লোকেশন (Location)", 
      "ডিভাইস (Device)", "অপারেটিং সিস্টেম (OS)", "ব্রাউজার (Browser)", 
      "সাইটে থাকার সময় (Time Spent)", "কোথা থেকে এসেছে (Referrer)", 
      "স্ক্রিন রেজুলেশন (Screen)", "সেশন আইডি (Session ID)"
    ]);
    trackSheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#d0e1fd");
  }
  
  if (!orderSheet || orderSheet.getLastRow() <= 1) {
    return "অর্ডার শিটে কোনো রো নেই";
  }
  
  var lastRow = orderSheet.getLastRow();
  var cleanedCount = 0;
  
  // ১. নিচ থেকে ওপরের দিকে লুপ চালিয়ে ট্র্যাকিং রো রিমুভ
  for (var r = lastRow; r >= 2; r--) {
    var rowValues = orderSheet.getRange(r, 1, 1, Math.min(orderSheet.getLastColumn(), 11)).getValues()[0];
    var colA = String(rowValues[0] || "").trim();
    var colB = String(rowValues[1] || "").trim();
    var colC = String(rowValues[2] || "").trim();
    var colD = String(rowValues[3] || "").trim();
    var colE = String(rowValues[4] || "").trim();
    var colF = String(rowValues[5] || "").trim();
    var colG = String(rowValues[6] || "").trim();
    
    // ট্র্যাকিং রো শনাক্তকরণ
    var isTrackingRow = (
      colB.indexOf("হোমপেজ") !== -1 || colB.indexOf("Home") !== -1 ||
      colC.indexOf("103.") !== -1 || (colC.indexOf(".") !== -1 && colC.split(".").length === 4) ||
      colD === "Bangladesh" ||
      colE.indexOf("Desktop") !== -1 || colE.indexOf("Mobile") !== -1 ||
      colF.indexOf("Windows") !== -1 || colF.indexOf("Android") !== -1 ||
      colG === "Chrome" || colG === "Safari" || colG === "Firefox" ||
      (colA.indexOf("NK-") === -1 && colA.indexOf("ORD-") === -1 && colB.indexOf("202") !== -1 && colC.indexOf("103.") !== -1)
    );
    
    if (isTrackingRow) {
      orderSheet.deleteRow(r);
      cleanedCount++;
    }
  }

  // ২. ডুপ্লিকেট অর্ডার রিমুভ (প্রতিটি Order ID যেন কেবল একবারই থাকে)
  var duplicateOrdersRemoved = 0;
  var seenOrderIds = {};
  var currentOrderLastRow = orderSheet.getLastRow();
  for (var o = currentOrderLastRow; o >= 2; o--) {
    var checkOrderId = String(orderSheet.getRange(o, 1).getValue() || "").trim();
    if (checkOrderId) {
      if (seenOrderIds[checkOrderId]) {
        orderSheet.deleteRow(o);
        duplicateOrdersRemoved++;
      } else {
        seenOrderIds[checkOrderId] = true;
      }
    }
  }

  // ৩. user traking শিট থেকে ডুপ্লিকেট রো রিমুভ
  var duplicateTrackingRemoved = 0;
  if (trackSheet.getLastRow() > 1) {
    var seenTracks = {};
    var trackLastRow = trackSheet.getLastRow();
    for (var t = trackLastRow; t >= 2; t--) {
      var tRow = trackSheet.getRange(t, 1, 1, Math.min(trackSheet.getLastColumn(), 11)).getValues()[0];
      var tTime = String(tRow[0] || "").trim();
      var tPage = String(tRow[1] || "").trim();
      var tIp = String(tRow[2] || "").trim();
      var tKey = tTime + "_" + tPage + "_" + tIp;
      if (seenTracks[tKey]) {
        trackSheet.deleteRow(t);
        duplicateTrackingRemoved++;
      } else {
        seenTracks[tKey] = true;
      }
    }
  }
  
  return "ক্লিনআপ সম্পন্ন! " + cleanedCount + " টি ট্র্যাকিং রো, " + duplicateOrdersRemoved + " টি ডুপ্লিকেট অর্ডার এবং " + duplicateTrackingRemoved + " টি ডুপ্লিকেট ট্র্যাকিং রো সফলভাবে মোছা হয়েছে!";
}

// ==========================================
// ৪. কাস্টমার শিট হেডার ঠিক করা এবং ভুল করে ঢোকা অর্ডার রো সরানো
// ==========================================
function fixAndCleanCustomersSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var custSheet = findSheet(ss, ["Customers", "customers", "Customer", "customer", "coustomer sheet", "customer sheet", "coustomer"], "custom", "order") ||
                  ss.getSheetByName("Customers") ||
                  ss.getSheetByName("coustomer sheet");
  var orderSheet = findSheet(ss, ["order sheet", "Order Sheet", "Orders"], "order", "custom", "coustom") ||
                   ss.getSheetByName("order sheet");
                   
  if (!custSheet) {
    return "Customers শিট পাওয়া যায়নি";
  }

  // ১. হেডার রো ঠিক করা (Customer ID, Registration Date, Name, Phone, Email, Address, Password)
  var correctHeaders = ["Customer ID", "Registration Date", "Name", "Phone", "Email", "Address", "Password"];
  custSheet.getRange(1, 1, 1, 7).setValues([correctHeaders]);
  custSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#d1e7dd");

  if (custSheet.getLastRow() <= 1) {
    return "Customers শিটের হেডার ঠিক করা হয়েছে!";
  }

  var lastRow = custSheet.getLastRow();
  var ordersMoved = 0;

  // ২. নিচ থেকে ওপরের দিকে লুপ চালিয়ে অর্ডার রো গুলোকে order sheet এ সরানো
  for (var r = lastRow; r >= 2; r--) {
    var rowValues = custSheet.getRange(r, 1, 1, Math.min(custSheet.getLastColumn(), 16)).getValues()[0];
    var colA = String(rowValues[0] || "").trim();
    var colB = String(rowValues[1] || "").trim();
    var colC = String(rowValues[2] || "").trim();
    var colD = String(rowValues[3] || "").trim();
    var colE = String(rowValues[4] || "").trim();
    
    // শনাক্তকরণ: যদি Col E বা Col A তে NK- বা TEST- থাকে, তবে এটা অর্ডার, কাস্টমার নয়!
    var isOrderRow = (
      colA.indexOf("NK-") !== -1 || colA.indexOf("ORD-") !== -1 ||
      colE.indexOf("NK-") !== -1 || colE.indexOf("TEST-") !== -1 || colE.indexOf("ORD-") !== -1 ||
      (colB.length >= 10 && !isNaN(colB) && colC.length > 0 && String(colD).indexOf("Dhaka") !== -1)
    );

    if (isOrderRow) {
      if (orderSheet) {
        var ordId = (colE.indexOf("NK-") !== -1 || colE.indexOf("TEST-") !== -1) ? colE : colA;
        var alreadyInOrders = false;
        if (orderSheet.getLastRow() > 1 && ordId) {
          var oIds = orderSheet.getRange(2, 1, orderSheet.getLastRow() - 1, 1).getValues();
          for (var j = 0; j < oIds.length; j++) {
            if (String(oIds[j][0]).trim() === ordId) {
              alreadyInOrders = true;
              break;
            }
          }
        }
        if (!alreadyInOrders) {
          var ordDate = String(rowValues[6] || rowValues[1] || new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
          var cName = colC;
          var cPhone = colB;
          var cAddr = colD;
          var totPrice = String(rowValues[7] || "৳0");
          orderSheet.appendRow([ordId, ordDate, cName, "", cPhone, cAddr, "Order Items", totPrice, "Cash on Delivery", "Pending", "", "TRK-" + ordId.replace(/\D/g, ""), "অর্ডার কনফার্মেশন সম্পন্ন হয়েছে", "", "", "Cash on Delivery"]);
        }
      }
      custSheet.deleteRow(r);
      ordersMoved++;
    }
  }

  return "Customers শিট ঠিক করা হয়েছে! হেডার নিখুঁত করা হয়েছে এবং " + ordersMoved + " টি অর্ডার রো সরানো হয়েছে!";
}`;

  return (
    <AnimatePresence>
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 md:p-6 overflow-y-auto overscroll-contain">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCloseAdminModal}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl rounded-none sm:rounded-3xl bg-zinc-900 border-0 sm:border border-zinc-700/80 text-zinc-100 shadow-2xl overflow-hidden z-10 my-0 sm:my-auto flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92dvh]"
        >
          {/* Top Admin Header Bar */}
          <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-sm sm:text-base text-white tracking-wide font-display truncate">
                    Nirapod Kroy Master Console
                  </h2>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-emerald-400 border border-emerald-500/30">
                    PROTECTED ROOT
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate">
                  Master Security Access — Authorized Personnel Only
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAdminLoggedIn && (
                <button
                  onClick={handleAdminLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-rose-400 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit Console</span>
                </button>
              )}
              <button
                onClick={handleCloseAdminModal}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close admin modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {!isAdminLoggedIn ? (
            /* 1. SECRET ADMIN LOGIN FORM */
            <div className="flex-1 overflow-y-auto overscroll-contain p-6 sm:p-8 max-w-md mx-auto w-full text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto text-amber-400 mb-3 shadow-inner">
                <KeyRound className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white font-display">
                এডমিন প্যানেলে লগইন করুন
              </h3>
              <p className="text-xs text-zinc-400 mt-1 mb-6">
                আপনার এডমিন ইমেইল ও পাসওয়ার্ড প্রদান করে কনসোল আনলক করুন।
              </p>

              <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    ইমেইল অ্যাড্রেস (Admin Email)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@example.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-zinc-300">
                      পাসওয়ার্ড (Password)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="text-[11px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                    >
                      {showAdminPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showAdminPassword ? "লুকান" : "দেখান"}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 cursor-pointer"
                      title={showAdminPassword ? "Hide password" : "Show password"}
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {isLoggingIn ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    ) : (
                      "লগইন করুন (Unlock Console)"
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-4 border-t border-zinc-800 text-[11px] text-zinc-500">
                <span>সিকিউর সার্ভার-সাইড ভেরিফিকেশন। অননুমোদিত প্রবেশ সম্পূর্ণ নিষিদ্ধ।</span>
              </div>
            </div>
          ) : (
            /* 2. AUTHENTICATED ADMIN DASHBOARD */
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Tab Navigation & Action Bar */}
              <div className="shrink-0 px-3 sm:px-6 py-2.5 bg-zinc-950/80 border-b border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-4">
                {/* Scrollable Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      activeTab === "dashboard"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("products")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      activeTab === "products"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Products ({products.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      activeTab === "orders"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Orders ({orders.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("customers")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      activeTab === "customers"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Customers ({customers.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("subscribers")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      activeTab === "subscribers"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Mail className="w-4 h-4 text-amber-400" />
                    <span>Subscribers ({subscribers.length})</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("tracking");
                      fetchTrackingData();
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      activeTab === "tracking"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>User Tracking ({userTracking.length})</span>
                    {trackingStats?.activeNow && trackingStats.activeNow > 0 ? (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    ) : null}
                  </button>
                  <button
                    onClick={() => setActiveTab("sheets")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      activeTab === "sheets"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Google Sheets Sync</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("github")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      activeTab === "github"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Github className="w-4 h-4 text-purple-400" />
                    <span>GitHub Sync</span>
                  </button>
                </div>

                {/* Quick Actions (Always Visible, Never Hidden) */}
                <div className="flex items-center justify-end gap-2 shrink-0 pt-1.5 md:pt-0 border-t md:border-t-0 border-zinc-800/80 flex-wrap">
                  <button
                    onClick={handleSyncFromGoogleSheets}
                    disabled={isSyncingFromSheets}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 font-bold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap"
                    title="গুগল শিট থেকে অর্ডার, কাস্টমার, সাবস্ক্রাইব ও ট্র্যাকিং ডেটা সিঙ্ক করুন"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFromSheets ? "animate-spin" : ""}`} />
                    <span>{isSyncingFromSheets ? "সিঙ্ক হচ্ছে..." : "শিট থেকে সিঙ্ক"}</span>
                  </button>

                  {isLiveSheetMode && !isSyncedDataSaved && (
                    <button
                      onClick={handleSaveSyncedData}
                      disabled={isSavingSyncedData}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap animate-pulse"
                      title="প্রিভিউ করা ডেটা অ্যাডমিন প্যানেলে স্থায়ীভাবে সেভ করুন"
                    >
                      <Save className={`w-3.5 h-3.5 ${isSavingSyncedData ? "animate-spin" : ""}`} />
                      <span>{isSavingSyncedData ? "সেভ হচ্ছে..." : "💾 ডেটা সেভ করুন"}</span>
                    </button>
                  )}

                  {isSyncedDataSaved && (
                    <button
                      onClick={() => setShowClearConfirmModal(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition-all cursor-pointer whitespace-nowrap"
                      title="অ্যাডমিন প্যানেল থেকে সেভ করা ডেটা মুছে ফেলুন (গুগল শিট অক্ষত থাকবে)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>সেভ ডেটা মুছুন</span>
                    </button>
                  )}

                  <button
                    onClick={handlePushToGithub}
                    disabled={isPushingToGithub}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap"
                    title="GitHub-এ সরাসরি পুশ ও অটো-ডিপ্লয় করুন"
                  >
                    <Github className={`w-3.5 h-3.5 ${isPushingToGithub ? "animate-spin" : ""}`} />
                    <span>{isPushingToGithub ? "পুশ হচ্ছে..." : "GitHub-এ পুশ"}</span>
                  </button>
                  <button
                    onClick={handlePublishLive}
                    disabled={isPublishingLive}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap"
                    title="সকল পরিবর্তন লোকাল ও লাইভ ক্যাশে সেভ করুন"
                  >
                    <CloudUpload className={`w-3.5 h-3.5 ${isPublishingLive ? "animate-bounce" : ""}`} />
                    <span>{isPublishingLive ? "সেভ হচ্ছে..." : "ব্রাউজারে সেভ"}</span>
                  </button>
                  <button
                    onClick={fetchAdminData}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Refresh Dashboard Data"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
                {/* Global Google Sheets Sync & Persistence Controller */}
                {activeTab !== "github" && activeTab !== "products" && (
                  <div className={`rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-lg relative overflow-hidden backdrop-blur-sm ${
                    isLiveSheetMode && !isSyncedDataSaved
                      ? "bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-900 border-amber-500/50"
                      : isSyncedDataSaved
                      ? "bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 border-emerald-500/50"
                      : "bg-zinc-900/90 border-zinc-800"
                  }`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                          isLiveSheetMode && !isSyncedDataSaved
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : isSyncedDataSaved
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                        }`}>
                          {isLiveSheetMode && !isSyncedDataSaved ? (
                            <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                          ) : isSyncedDataSaved ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <FileSpreadsheet className="w-5 h-5 text-sky-400" />
                          )}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-white">
                              {isLiveSheetMode && !isSyncedDataSaved
                                ? "শিট থেকে লাইভ প্রিভিউ মোড (অসংরক্ষিত ডেটা)"
                                : isSyncedDataSaved
                                ? "অ্যাডমিন প্যানেলে ডেটা সংরক্ষিত রয়েছে (Data Saved)"
                                : "গুগল শিট থেকে ডেটা সিঙ্ক কন্ট্রোল"}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                              isLiveSheetMode && !isSyncedDataSaved
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : isSyncedDataSaved
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                            }`}>
                              {isLiveSheetMode && !isSyncedDataSaved
                                ? "লাইভ প্রিভিউ • বের হলে মুছে যাবে"
                                : isSyncedDataSaved
                                ? "অ্যাডমিন প্যানেলে সেভ করা"
                                : "কোনো ডেটা সেভ নেই"}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {isLiveSheetMode && !isSyncedDataSaved
                              ? "গুগল শিট থেকে অর্ডার, কাস্টমার, সাবস্ক্রাইব ও ট্র্যাকিং ডেটা শুধু দেখার জন্য লোড করা হয়েছে। অ্যাডমিন প্যানেল থেকে বের হয়ে গেলে এগুলো থাকবে না। অ্যাডমিন প্যানেলে স্থায়ীভাবে রাখতে চাইলে 'সেভ করুন' বাটনে ক্লিক করুন।"
                              : isSyncedDataSaved
                              ? "অর্ডার, কাস্টমার, সাবস্ক্রাইব ও ট্র্যাকিং ডেটা অ্যাডমিন প্যানেলে সেভ করা রয়েছে। গুগল শিটের মূল রেকর্ডও সম্পূর্ণ অক্ষত রয়েছে। আপনি চাইলে যখন ইচ্ছা সেভ করা ডেটা মুছে ফেলতে পারেন।"
                              : "অ্যাডমিন প্যানেলে কোনো ডেটা সেভ করা নেই। গুগল শিটের ডেটা দেখতে 'শিট থেকে সিঙ্ক' বাটনে চাপুন। সেভ না করে বের হয়ে গেলে কোনো ডেটা জমা থাকবে না।"}
                          </p>
                        </div>
                      </div>

                      {/* Control Actions */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                        <button
                          type="button"
                          onClick={handleSyncFromGoogleSheets}
                          disabled={isSyncingFromSheets}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-white transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 whitespace-nowrap"
                          title="গুগল শিট থেকে সর্বশেষ ডেটা সিঙ্ক করুন"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isSyncingFromSheets ? "animate-spin" : ""}`} />
                          <span>{isSyncingFromSheets ? "সিঙ্ক হচ্ছে..." : "শিট থেকে সিঙ্ক"}</span>
                        </button>

                        {isLiveSheetMode && !isSyncedDataSaved && (
                          <>
                            <button
                              type="button"
                              onClick={handleSaveSyncedData}
                              disabled={isSavingSyncedData}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-emerald-900/30 active:scale-95 disabled:opacity-50 whitespace-nowrap"
                              title="প্রিভিউ করা ডেটা অ্যাডমিন প্যানেলে সেভ করুন"
                            >
                              <Save className={`w-3.5 h-3.5 ${isSavingSyncedData ? "animate-spin" : ""}`} />
                              <span>{isSavingSyncedData ? "সেভ হচ্ছে..." : "💾 ডেটা সেভ করুন"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleDiscardPreview}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                              title="প্রিভিউ ডেটা ফেলে দিন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>প্রিভিউ মুছুন</span>
                            </button>
                          </>
                        )}

                        {isSyncedDataSaved && (
                          <button
                            type="button"
                            onClick={() => setShowClearConfirmModal(true)}
                            disabled={isClearingSavedData}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
                            title="অ্যাডমিন প্যানেল থেকে সেভ করা ডেটা মুছে ফেলুন (গুগল শিট অক্ষত থাকবে)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>সেভ ডেটা মুছুন</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {/* TAB 1: DASHBOARD OVERVIEW */}
                {activeTab === "dashboard" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Total Revenue Card (Editable) */}
                      <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 hover:border-zinc-600 transition-all relative group">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-zinc-400">Total Revenue (মোট আয়)</span>
                          <button
                            type="button"
                            onClick={handleOpenEditRevenue}
                            className="p-1 px-2 rounded-lg bg-zinc-900/80 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                            title="মোট রেভিনিউ আপনার ইচ্ছামতো পরিবর্তন করুন"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>এডিট</span>
                          </button>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-emerald-400 font-display">
                          ৳{(stats?.totalRevenue ?? 0).toLocaleString()}
                        </p>
                        <div className="flex items-center justify-between gap-1.5 mt-1.5 text-[11px] text-zinc-400 flex-wrap">
                          <span>
                            {stats?.isCustomRevenue ? (
                              <span className="text-amber-400 font-semibold">✏️ কাস্টম সেট করা</span>
                            ) : (
                              "অর্ডার থেকে স্বয়ংক্রিয়"
                            )}
                          </span>
                          {stats?.isCustomRevenue && (
                            <button
                              type="button"
                              onClick={handleResetRevenue}
                              disabled={isSavingRevenue}
                              className="text-[10px] text-amber-300 underline hover:text-amber-200 cursor-pointer"
                            >
                              রিসেট
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-zinc-400">Total Orders</span>
                          <ShoppingCart className="w-4 h-4 text-sky-400" />
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-white font-display">
                          {stats?.totalOrders || orders.length}
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-1">Incoming customer checkouts</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-zinc-400">Inventory Items</span>
                          <Package className="w-4 h-4 text-indigo-400" />
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-white font-display">
                          {products.length}
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-1">Active catalog products</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-zinc-400">Sheets Synced</span>
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-white font-display">
                          {orders.filter(o => o.syncedToGoogleSheet).length} / {orders.length}
                        </p>
                        <p className="text-[11px] text-emerald-400 mt-1">Auto-logged to spreadsheet</p>
                      </div>
                    </div>

                    {/* Quick Overview Bento */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="p-5 rounded-2xl bg-zinc-800/40 border border-zinc-700/60">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-sm text-white flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-emerald-400" />
                            Recent Store Checkouts
                          </h4>
                          <button
                            onClick={() => setActiveTab("orders")}
                            className="text-xs text-emerald-400 hover:underline"
                          >
                            View All
                          </button>
                        </div>
                        <div className="space-y-2.5">
                          {orders.slice(0, 4).map((order) => (
                            <div
                              key={order.id}
                              className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-white">{order.customerName}</span>
                                <p className="text-[11px] text-zinc-400">
                                  {order.items[0]?.title} • #{order.id}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-white">${order.totalPrice.toFixed(2)}</span>
                                <p className="text-[10px] text-emerald-400">{order.status}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-zinc-800/40 border border-zinc-700/60 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-white flex items-center gap-2 mb-3">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                            Google Sheets Integration Status
                          </h4>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            Order payloads automatically dispatch to your private Google Sheet webhook whenever customers place orders.
                          </p>
                          <div className="mt-4 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                            <span className="text-zinc-400">Active Webhook: </span>
                            <span className="font-mono text-emerald-400 truncate block mt-0.5">
                              {webhookUrl || "No webhook URL provided yet"}
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 flex gap-2">
                          <button
                            onClick={() => setActiveTab("sheets")}
                            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                          >
                            Configure Webhook & Get Script
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: PRODUCTS MANAGER (CRUD) */}
                {activeTab === "products" && (
                  <div className="space-y-4">
                    {/* Live Server Sync & Quick Action Banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-zinc-900 border border-emerald-500/30 shadow-md">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            <h4 className="font-bold text-sm text-white font-display">
                              লাইভ সার্ভার ডাটাবেজ ও ক্যাটালগ সিঙ্ক (Live Catalog Sync)
                            </h4>
                            {lastPublishedTime && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                                সেভ হয়েছে: {lastPublishedTime}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-300">
                            নতুন পণ্য যোগ, এডিট বা ডিলিট করার পর নিচের বাটনে চাপ দিলে তা সাথে সাথে সার্ভারে সেভ ও লাইভ হয়ে যাবে।
                          </p>
                          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-zinc-400">
                            <span>মোট পণ্য: <strong className="text-white">{adminProducts.length}</strong></span>
                            <span>•</span>
                            <span>সক্রিয় (Active): <strong className="text-emerald-400">{adminProducts.filter(p => p.isActive !== false).length}</strong></span>
                            <span>•</span>
                            <span>লুকানো (Inactive): <strong className="text-amber-400">{adminProducts.filter(p => p.isActive === false).length}</strong></span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={handlePushToGithub}
                            disabled={isPushingToGithub}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                            title="GitHub-এ সরাসরি সেভ ও ডিপ্লয় করুন"
                          >
                            <Github className={`w-4 h-4 ${isPushingToGithub ? "animate-spin" : ""}`} />
                            <span>{isPushingToGithub ? "গিটহাবে পুশ হচ্ছে..." : "GitHub-এ পুশ করুন"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handlePublishLive}
                            disabled={isPublishingLive}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                            title="ব্রাউজার ও লোকাল ক্যাশে সেভ করুন"
                          >
                            <CloudUpload className={`w-4 h-4 ${isPublishingLive ? "animate-spin" : ""}`} />
                            <span>{isPublishingLive ? "সেভ হচ্ছে..." : "ব্রাউজারে সেভ"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleExportProductsJson}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold text-xs border border-zinc-700 transition-colors cursor-pointer"
                            title="Download products.json backup"
                          >
                            <Download className="w-3.5 h-3.5 text-zinc-400" />
                            <span>JSON ব্যাকআপ</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveTab("github")}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-purple-300 hover:text-white font-semibold text-xs border border-purple-500/30 transition-colors cursor-pointer"
                            title="GitHub সেটিংস দেখুন"
                          >
                            <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                            <span>GitHub সেটিংস</span>
                          </button>

                          <a
                            href="./sitemap.xml"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold text-xs border border-zinc-700 transition-colors cursor-pointer"
                            title="View XML Sitemap"
                          >
                            <FileText className="w-3.5 h-3.5 text-sky-400" />
                            <span>সাইটম্যাপ</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-base text-white">Product Catalog Management</h3>
                        <p className="text-xs text-zinc-400">
                          Add, edit, toggle active/inactive status, or manage affiliate items
                        </p>
                      </div>
                      <button
                        onClick={handleOpenAddProduct}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Product</span>
                      </button>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-zinc-800/60 border border-zinc-700/60">
                      <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          placeholder="Search product by title, category..."
                          className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                        <button
                          type="button"
                          onClick={() => setProductStatusFilter("all")}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                            productStatusFilter === "all"
                              ? "bg-zinc-700 text-white"
                              : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          All ({adminProducts.length > 0 ? adminProducts.length : products.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductStatusFilter("active")}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                            productStatusFilter === "active"
                              ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                              : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          Active ({adminProducts.filter((p) => p.isActive !== false).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductStatusFilter("inactive")}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                            productStatusFilter === "inactive"
                              ? "bg-amber-600/30 text-amber-300 border border-amber-500/40"
                              : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          Inactive ({adminProducts.filter((p) => p.isActive === false).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductStatusFilter("offer_zone")}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                            productStatusFilter === "offer_zone"
                              ? "bg-amber-500 text-zinc-950 font-bold border border-amber-400"
                              : "bg-zinc-900/60 text-amber-300 hover:text-amber-200 border border-amber-500/30"
                          }`}
                        >
                          🔥 অফার জোন ({adminProducts.filter((p) => p.isOfferZone || (p.regularPrice && p.regularPrice > p.price)).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductStatusFilter("affiliate")}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                            productStatusFilter === "affiliate"
                              ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                              : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          Affiliate ({adminProducts.filter((p) => p.isAffiliate).length})
                        </button>
                      </div>
                    </div>

                    {/* Desktop & Tablet Table View */}
                    <div className="hidden md:block rounded-2xl border border-zinc-700 overflow-hidden bg-zinc-800/40">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-950 text-zinc-400 uppercase font-semibold text-[11px] border-b border-zinc-700">
                            <tr>
                              <th className="p-3.5">Product</th>
                              <th className="p-3.5">Category</th>
                              <th className="p-3.5">Price</th>
                              <th className="p-3.5 text-center">Website Status</th>
                              <th className="p-3.5 text-center">Offer Zone</th>
                              <th className="p-3.5">Stock / Type</th>
                              <th className="p-3.5">Badge</th>
                              <th className="p-3.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-700/60">
                            {(adminProducts.length > 0 ? adminProducts : products)
                              .filter((prod) => {
                                const term = productSearchTerm.toLowerCase();
                                const matchesSearch =
                                  !term ||
                                  prod.title.toLowerCase().includes(term) ||
                                  prod.category.toLowerCase().includes(term) ||
                                  (prod.parentCategory && prod.parentCategory.toLowerCase().includes(term)) ||
                                  (prod.affiliateSource && prod.affiliateSource.toLowerCase().includes(term));

                                if (!matchesSearch) return false;
                                if (productStatusFilter === "active") return prod.isActive !== false;
                                if (productStatusFilter === "inactive") return prod.isActive === false;
                                if (productStatusFilter === "offer_zone") {
                                  return Boolean(prod.isOfferZone || (prod.regularPrice && prod.regularPrice > prod.price));
                                }
                                if (productStatusFilter === "affiliate") return Boolean(prod.isAffiliate);
                                return true;
                              })
                              .map((prod) => {
                                const isActive = prod.isActive !== false;
                                return (
                                  <tr
                                    key={prod.id}
                                    className={`transition-colors ${
                                      isActive
                                        ? "hover:bg-zinc-800/60"
                                        : "bg-zinc-900/50 opacity-75 hover:opacity-100 hover:bg-zinc-800/60"
                                    }`}
                                  >
                                    <td className="p-3.5 flex items-center gap-3">
                                      <img
                                        src={prod.imageUrl}
                                        alt={prod.title}
                                        className="w-10 h-10 rounded-lg object-cover bg-zinc-900 shrink-0 border border-zinc-700"
                                      />
                                      <div className="min-w-0 max-w-xs">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <p className="font-semibold text-white truncate">{prod.title}</p>
                                          {prod.isOfferZone && (
                                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                              Offer
                                            </span>
                                          )}
                                          {prod.isAffiliate && (
                                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                              Affiliate
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <p className="text-[10px] text-zinc-400 font-mono">{prod.id}</p>
                                          {prod.affiliateUrl && (
                                            <a
                                              href={prod.affiliateUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-0.5 text-[10px] text-indigo-400 hover:underline"
                                            >
                                              <span>{prod.affiliateSource || "Link"}</span>
                                              <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-3.5 text-zinc-300">
                                      {prod.parentCategory ? (
                                        <div className="flex flex-col gap-0.5">
                                          <span className="text-[10px] text-zinc-400 font-medium">
                                            {prod.parentCategory} ›
                                          </span>
                                          <span className="text-xs font-semibold text-emerald-400">
                                            {prod.category}
                                          </span>
                                        </div>
                                      ) : isGrocerySubcategory(prod.category) ? (
                                        <div className="flex flex-col gap-0.5">
                                          <span className="text-[10px] text-zinc-400 font-medium">
                                            Groceries & Food ›
                                          </span>
                                          <span className="text-xs font-semibold text-emerald-400">
                                            {prod.category}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-xs font-medium text-zinc-300">
                                          {prod.category}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3.5 font-bold text-white">
                                      <span>৳{prod.price.toLocaleString()}</span>
                                      {prod.regularPrice && prod.regularPrice > prod.price && (
                                        <span className="block text-[10px] text-zinc-500 line-through">
                                          ৳{prod.regularPrice.toLocaleString()}
                                        </span>
                                      )}
                                    </td>
                                    
                                    {/* Active / Inactive Status Toggle Button */}
                                    <td className="p-3.5 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleActive(prod.id, isActive)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                          isActive
                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                                            : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200"
                                        }`}
                                        title={isActive ? "ক্লিক করলে ওয়েবসাইট থেকে লুকানো হবে (Click to Deactivate)" : "ক্লিক করলে ওয়েবসাইটে লাইভ হবে (Click to Activate)"}
                                      >
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full ${
                                            isActive ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
                                          }`}
                                        />
                                        <span>{isActive ? "Active (লাইভ)" : "Inactive (লুকানো)"}</span>
                                      </button>
                                    </td>

                                    {/* Offer Zone Toggle Button */}
                                    <td className="p-3.5 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleOfferZone(prod.id, Boolean(prod.isOfferZone))}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                          prod.isOfferZone
                                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30"
                                            : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200"
                                        }`}
                                        title={prod.isOfferZone ? "অফার জোন থেকে সরাতে ক্লিক করুন (মূল ক্যাটাগরিতে যথারীতি থাকবে)" : "অফার জোনে নিতে ক্লিক করুন (মূল ক্যাটাগরির পাশাপাশি অফার জোনেও দেখাবে)"}
                                      >
                                        <Tag className={`w-3 h-3 ${prod.isOfferZone ? "text-amber-400 fill-amber-400/30" : "text-zinc-500"}`} />
                                        <span>{prod.isOfferZone ? "অফারে সক্রিয়" : "+ অফারে নিন"}</span>
                                      </button>
                                    </td>

                                    <td className="p-3.5">
                                      {prod.isAffiliate ? (
                                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                          External Link
                                        </span>
                                      ) : (
                                        <span
                                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                            prod.stock <= 5
                                              ? "bg-rose-500/20 text-rose-400"
                                              : "bg-emerald-500/20 text-emerald-400"
                                          }`}
                                        >
                                          {prod.stock} units
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3.5">
                                      {prod.badge ? (
                                        <span className="px-2 py-0.5 rounded bg-zinc-700 text-zinc-200 text-[10px]">
                                          {prod.badge}
                                        </span>
                                      ) : (
                                        <span className="text-zinc-500">-</span>
                                      )}
                                    </td>
                                    <td className="p-3.5 text-right space-x-2">
                                      <button
                                        onClick={() => handleOpenEditProduct(prod)}
                                        className="p-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition-colors cursor-pointer"
                                        title="Edit Product"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteProduct(prod.id, prod.title)}
                                        className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-400 transition-colors cursor-pointer"
                                        title="Instant Delete Product"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Mobile Responsive Cards (Phone & Small Tablet Friendly) */}
                    <div className="md:hidden space-y-3">
                      {(adminProducts.length > 0 ? adminProducts : products)
                        .filter((prod) => {
                          const term = productSearchTerm.toLowerCase();
                          const matchesSearch =
                            !term ||
                            prod.title.toLowerCase().includes(term) ||
                            prod.category.toLowerCase().includes(term) ||
                            (prod.parentCategory && prod.parentCategory.toLowerCase().includes(term)) ||
                            (prod.affiliateSource && prod.affiliateSource.toLowerCase().includes(term));

                          if (!matchesSearch) return false;
                          if (productStatusFilter === "active") return prod.isActive !== false;
                          if (productStatusFilter === "inactive") return prod.isActive === false;
                          if (productStatusFilter === "offer_zone") {
                            return Boolean(prod.isOfferZone || (prod.regularPrice && prod.regularPrice > prod.price));
                          }
                          if (productStatusFilter === "affiliate") return Boolean(prod.isAffiliate);
                          return true;
                        })
                        .map((prod) => {
                          const isActive = prod.isActive !== false;
                          return (
                            <div
                              key={prod.id}
                              className={`p-3.5 rounded-2xl border transition-all ${
                                isActive
                                  ? "bg-zinc-800/80 border-zinc-700/80"
                                  : "bg-zinc-900/90 border-zinc-800 opacity-80"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.title}
                                  className="w-16 h-16 rounded-xl object-cover bg-zinc-900 shrink-0 border border-zinc-700"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="font-semibold text-white text-xs truncate">{prod.title}</h4>
                                    {prod.isOfferZone && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        Offer
                                      </span>
                                    )}
                                    {prod.isAffiliate && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                        Affiliate
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[12px] font-bold text-emerald-400">৳{prod.price.toLocaleString()}</span>
                                    {prod.regularPrice && prod.regularPrice > prod.price && (
                                      <span className="text-[10px] text-zinc-500 line-through">
                                        ৳{prod.regularPrice.toLocaleString()}
                                      </span>
                                    )}
                                    {prod.parentCategory ? (
                                      <span className="text-[10px] text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.5 rounded font-medium">
                                        {prod.parentCategory} › {prod.category}
                                      </span>
                                    ) : isGrocerySubcategory(prod.category) ? (
                                      <span className="text-[10px] text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.5 rounded font-medium">
                                        Groceries & Food › {prod.category}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-zinc-400 bg-zinc-700/50 px-1.5 py-0.5 rounded">{prod.category}</span>
                                    )}
                                    <span className="text-[10px] text-zinc-400 font-mono">স্টক: {prod.stock}</span>
                                  </div>

                                  {/* Mobile Active / Inactive Switch & Offer Zone & Action Buttons */}
                                  <div className="mt-3 pt-2.5 border-t border-zinc-700/50 flex items-center justify-between gap-2 flex-wrap">
                                    {/* Quick Status and Offer Toggles */}
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleActive(prod.id, isActive)}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                          isActive
                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                            : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                                        }`}
                                      >
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full ${
                                            isActive ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
                                          }`}
                                        />
                                        <span>{isActive ? "Active" : "Inactive"}</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleToggleOfferZone(prod.id, Boolean(prod.isOfferZone))}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                          prod.isOfferZone
                                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                                            : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                                        }`}
                                        title={prod.isOfferZone ? "অফার জোন থেকে সরান" : "অফার জোনে যোগ করুন"}
                                      >
                                        <Tag className={`w-3 h-3 ${prod.isOfferZone ? "text-amber-400 fill-amber-400/30" : "text-zinc-500"}`} />
                                        <span>{prod.isOfferZone ? "Offer Active" : "+ অফার"}</span>
                                      </button>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => handleOpenEditProduct(prod)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-[11px] font-medium transition-colors cursor-pointer"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteProduct(prod.id, prod.title)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-[11px] font-medium transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* TAB 3: ORDERS MANAGEMENT */}
                {activeTab === "orders" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-base text-white">Full Customer Orders List</h3>
                        <p className="text-xs text-zinc-400">
                          Complete privacy data (address, phone, items) visible exclusively to store owner
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-400">
                        Total Orders: {orders.length}
                      </span>
                    </div>

                    {isLoadingOrders ? (
                      <div className="p-8 text-center text-zinc-400">Loading orders...</div>
                    ) : orders.length === 0 ? (
                      <div className="p-8 text-center bg-zinc-800/40 rounded-2xl border border-zinc-700 text-zinc-400">
                        No orders recorded yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.map((order) => (
                          <div
                            key={order.id}
                            className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/70 space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-white">
                                  #{order.id}
                                </span>
                                <span className="text-zinc-500">•</span>
                                <span className="text-xs text-zinc-400">
                                  {new Date(order.createdAt).toLocaleString()}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                {/* Order Status Selector */}
                                <select
                                  value={order.status}
                                  onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                  className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Processing">Processing</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>

                                {/* Google Sheet Sync Button */}
                                <button
                                  onClick={() => handleSyncOrderToSheets(order.id)}
                                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                    order.syncedToGoogleSheet
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                                  }`}
                                  title="Sync row to Google Sheet"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5" />
                                  <span>{order.syncedToGoogleSheet ? "Synced" : "Sync Now"}</span>
                                </button>

                                {/* Delete Order Button (Admin panel only, retains Google Sheets data) */}
                                <button
                                  onClick={() => handleDeleteOrder(order)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer"
                                  title="অর্ডার ডিলিট করুন (গুগল শিটের রেকর্ড অক্ষত থাকবে)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>

                            {/* Customer & Shipping Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-xl bg-zinc-900/70 text-xs">
                              <div>
                                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Customer</span>
                                <span className="font-bold text-white">{order.customerName}</span>
                                <p className="text-zinc-400">{order.customerEmail}</p>
                                <p className="text-zinc-400">{order.customerPhone}</p>
                              </div>

                              <div>
                                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Delivery Address</span>
                                <p className="text-zinc-200 leading-snug">{order.shippingAddress}</p>
                              </div>

                              <div>
                                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Payment & Total</span>
                                <p className="text-zinc-300">{order.paymentMethod}</p>
                                {order.senderPhoneNumber && (
                                  <p className="text-[11px] text-sky-400 font-mono mt-0.5">
                                    <span className="text-zinc-400 font-sans">Send From:</span> {order.senderPhoneNumber}
                                  </p>
                                )}
                                {order.transactionId && (
                                  <p className="text-[11px] text-amber-400 font-mono mt-0.5">
                                    <span className="text-zinc-400 font-sans">TrxID:</span> {order.transactionId}
                                  </p>
                                )}
                                <p className="font-bold text-sm text-emerald-400 font-display mt-0.5">
                                  ৳{order.totalPrice.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {/* Ordered Items List */}
                            <div className="space-y-1 text-xs">
                              <span className="text-zinc-400 text-[11px] font-semibold">Ordered Items:</span>
                              <div className="flex flex-wrap gap-2">
                                {order.items.map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs"
                                  >
                                    {item.title} <strong className="text-emerald-400">x{item.quantity}</strong> (${(item.price * item.quantity).toFixed(2)})
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* 📦 Order Tracking & Google Sheet Details Management */}
                            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-emerald-500/30 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                    <Truck className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-xs font-bold text-white">
                                    অর্ডার ট্র্যাকিং ও গুগল শিট বিবরণ (Order Tracking Details)
                                  </span>
                                </div>
                                <span className="text-[11px] text-emerald-400 font-medium">
                                  গ্রাহক Order Tracking এ এই তথ্য দেখতে পাবেন
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {/* Tracking Number Input */}
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                    ট্র্যাকিং নম্বর (Tracking ID)
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      orderTrackingDrafts[order.id]?.trackingNumber !== undefined
                                        ? orderTrackingDrafts[order.id].trackingNumber
                                        : (order.trackingNumber || ("TRK-" + order.id.replace(/\D/g, "")))
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setOrderTrackingDrafts((prev) => ({
                                        ...prev,
                                        [order.id]: {
                                          ...prev[order.id],
                                          trackingNumber: val
                                        }
                                      }));
                                    }}
                                    placeholder="যেমন: TRK-123456 বা কুরিয়ার আইডি"
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>

                                {/* Order Tracking Details Input */}
                                <div className="space-y-1 sm:col-span-2">
                                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                    অর্ডার ট্র্যাকিং বিবরণ (Order Tracking Details - শিটের রো/কলামে যাবে)
                                  </label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={
                                        orderTrackingDrafts[order.id]?.orderTrackingDetails !== undefined
                                          ? orderTrackingDrafts[order.id].orderTrackingDetails
                                          : (order.orderTrackingDetails || order.trackingDetails || "অর্ডার কনফার্মেশন সম্পন্ন হয়েছে। প্যাকেজিং ও কুরিয়ারে পাঠানোর কাজ চলছে।")
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setOrderTrackingDrafts((prev) => ({
                                          ...prev,
                                          [order.id]: {
                                            ...prev[order.id],
                                            orderTrackingDetails: val
                                          }
                                        }));
                                      }}
                                      placeholder="যেমন: সুন্দরবন কুরিয়ারে বুকিং হয়েছে, ট্র্যাকিং নং: SB-99201"
                                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />

                                    <button
                                      type="button"
                                      disabled={isUpdatingTracking[order.id]}
                                      onClick={() => {
                                        const draft = orderTrackingDrafts[order.id] || {};
                                        const tNum = draft.trackingNumber !== undefined
                                          ? draft.trackingNumber
                                          : (order.trackingNumber || ("TRK-" + order.id.replace(/\D/g, "")));
                                        const tDet = draft.orderTrackingDetails !== undefined
                                          ? draft.orderTrackingDetails
                                          : (order.orderTrackingDetails || order.trackingDetails || "অর্ডার কনফার্মেশন সম্পন্ন হয়েছে।");
                                        const st = draft.status || order.status;
                                        handleUpdateOrderTracking(order.id, tNum, tDet, st);
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                                    >
                                      {isUpdatingTracking[order.id] ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5" />
                                      )}
                                      <span>সেভ ও শিট আপডেট</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3.5: CUSTOMERS MANAGEMENT */}
                {activeTab === "customers" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-base text-white flex items-center gap-2">
                          <Users className="w-5 h-5 text-sky-400" />
                          <span>Customer Database (অর্ডারকারী ও নিবন্ধিত গ্রাহক)</span>
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          ওয়েবসাইট থেকে যেকোনো গ্রাহক অর্ডার করলে বা অ্যাকাউন্ট খুললে স্বয়ংক্রিয়ভাবে এখানে যুক্ত হবে।
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold">
                          মোট গ্রাহক: {customers.length} জন
                        </span>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="গ্রাহকের নাম, ইমেইল অথবা মোবাইল নম্বর দিয়ে খুঁজুন..."
                        value={customerSearchTerm}
                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    {isLoadingCustomers ? (
                      <div className="p-8 text-center text-zinc-400">Loading customers...</div>
                    ) : customers.length === 0 ? (
                      <div className="p-8 text-center bg-zinc-800/40 rounded-2xl border border-zinc-700 text-zinc-400">
                        এখনও কোনো কাস্টমার ডেটা সংরক্ষিত নেই। অর্ডার আসলেই গ্রাহক ডেটা এখানে ও গুগল শিটে জমা হবে।
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {customers
                          .filter((c) => {
                            if (!customerSearchTerm.trim()) return true;
                            const term = customerSearchTerm.toLowerCase();
                            return (
                              c.name?.toLowerCase().includes(term) ||
                              c.email?.toLowerCase().includes(term) ||
                              (c.phone && c.phone.toLowerCase().includes(term)) ||
                              (c.address && c.address.toLowerCase().includes(term))
                            );
                          })
                          .map((cust) => (
                            <div
                              key={cust.id}
                              className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/70 space-y-3 hover:border-zinc-600 transition-colors"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-sm">
                                    {cust.name ? cust.name.charAt(0).toUpperCase() : "C"}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm text-white">{cust.name}</h4>
                                    <p className="text-[11px] text-zinc-400 font-mono">
                                      যুক্ত হয়েছেন: {new Date(cust.createdAt).toLocaleDateString("bn-BD")}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                                    অর্ডার: {cust.orderCount || 0} টি
                                  </span>
                                  <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-bold">
                                    মোট খরচ: ${(cust.totalSpent || 0).toFixed(2)}
                                  </span>

                                  {/* Delete Customer Button (Admin panel only, retains Google Sheets data) */}
                                  <button
                                    onClick={() => handleDeleteCustomer(cust)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer"
                                    title="কাস্টমার ডেটা ডিলিট করুন (গুগল শিটের রেকর্ড অক্ষত থাকবে)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>

                              {/* Customer Contact & Address Details */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-xl bg-zinc-900/70 text-xs">
                                <div>
                                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">ইমেইল ঠিকানা</span>
                                  <span className="font-medium text-white">{cust.email}</span>
                                </div>

                                <div>
                                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">মোবাইল নম্বর</span>
                                  <span className="font-medium text-zinc-200">{cust.phone || "N/A"}</span>
                                </div>

                                <div>
                                  <span className="text-zinc-500 block text-[10px] uppercase font-bold">ডেলিভারি ঠিকানা</span>
                                  <p className="font-medium text-zinc-200 leading-snug">{cust.address || "N/A"}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: SUBSCRIBERS LIST */}
                {activeTab === "subscribers" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-base text-white flex items-center gap-2">
                          <Mail className="w-5 h-5 text-amber-400" />
                          নিউজলেটার ও সাবস্ক্রাইবার তালিকা ({subscribers.length})
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1">
                          ফুটার ও বিভিন্ন ক্যাম্পেইন থেকে সংগৃহীত ইমেইল তালিকা। প্রতিটি সাবস্ক্রিপশন সাথে সাথে গুগল শিটের "Subscribers" ট্যাবেও সিঙ্ক হয়।
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSyncFromGoogleSheets}
                          disabled={isSyncingFromSheets}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors"
                          title="গুগল শিট থেকে নতুন সাবস্ক্রাইবার ও অর্ডার সিঙ্ক করুন"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFromSheets ? "animate-spin" : ""}`} />
                          <span>{isSyncingFromSheets ? "সিঙ্ক হচ্ছে..." : "শিট থেকে সিঙ্ক"}</span>
                        </button>
                        <button
                          onClick={exportSubscribersToCsv}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold cursor-pointer transition-colors"
                          title="CSV ফরম্যাটে সমস্ত ইমেইল ডাউনলোড করুন"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>CSV ডাউনলোড</span>
                        </button>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="ইমেইল বা সোর্স দিয়ে সাবস্ক্রাইবার খুঁজুন..."
                        value={subscriberSearchTerm}
                        onChange={(e) => setSubscriberSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {/* Subscribers List Content */}
                    {isLoadingSubscribers ? (
                      <div className="py-12 flex flex-col items-center justify-center text-zinc-400">
                        <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mb-2" />
                        <span className="text-xs">সাবস্ক্রাইবার তালিকা লোড হচ্ছে...</span>
                      </div>
                    ) : subscribers.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl bg-zinc-800/40 border border-zinc-800">
                        <Mail className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-zinc-300">এখনও কোনো সাবস্ক্রাইবার তালিকাভুক্ত হয়নি</p>
                        <p className="text-xs text-zinc-500 mt-1">ওয়েবসাইটের ফুটারে ইমেইল সাবস্ক্রাইব করা হলে তা এখানে এবং গুগল শিটে প্রদর্শিত হবে।</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
                          <table className="w-full text-left text-xs text-zinc-300">
                            <thead className="bg-zinc-800/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-700">
                              <tr>
                                <th className="py-3 px-4">#</th>
                                <th className="py-3 px-4">ইমেইল অ্যাড্রেস</th>
                                <th className="py-3 px-4">উৎস (Source)</th>
                                <th className="py-3 px-4">সাবস্ক্রিপশনের সময়</th>
                                <th className="py-3 px-4 text-right">অ্যাকশন</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                              {subscribers
                                .filter(s =>
                                  s.email.toLowerCase().includes(subscriberSearchTerm.toLowerCase()) ||
                                  s.source.toLowerCase().includes(subscriberSearchTerm.toLowerCase())
                                )
                                .map((sub, idx) => (
                                  <tr key={sub.email + idx} className="hover:bg-zinc-800/40 transition-colors">
                                    <td className="py-3 px-4 font-mono text-zinc-500 text-[11px]">{idx + 1}</td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-2 font-medium text-white">
                                        <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        <span>{sub.email}</span>
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(sub.email);
                                            addToast("ইমেইল কপি করা হয়েছে!", "success");
                                          }}
                                          className="p-1 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                                          title="ইমেইল কপি করুন"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                        {sub.source || "Website Footer"}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                                      {new Date(sub.subscribedAt).toLocaleString("bn-BD", {
                                        dateStyle: "medium",
                                        timeStyle: "short"
                                      })}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <button
                                        onClick={() => setSubscriberToDelete(sub.email)}
                                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                                        title="সাবস্ক্রাইবার মুছে ফেলুন"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Responsive Cards */}
                        <div className="md:hidden space-y-2.5">
                          {subscribers
                            .filter(s =>
                              s.email.toLowerCase().includes(subscriberSearchTerm.toLowerCase()) ||
                              s.source.toLowerCase().includes(subscriberSearchTerm.toLowerCase())
                            )
                            .map((sub, idx) => (
                              <div
                                key={sub.email + idx}
                                className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/80 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono text-zinc-400">#{idx + 1}</span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    {sub.source || "Website Footer"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 font-medium text-white text-xs truncate">
                                    <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span className="truncate">{sub.email}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(sub.email);
                                        addToast("ইমেইল কপি করা হয়েছে!", "success");
                                      }}
                                      className="p-1.5 rounded-lg bg-zinc-700 text-zinc-300 hover:text-white"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setSubscriberToDelete(sub.email)}
                                      className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <div className="text-[11px] text-zinc-400 font-mono">
                                  {new Date(sub.subscribedAt).toLocaleString("bn-BD", {
                                    dateStyle: "medium",
                                    timeStyle: "short"
                                  })}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: REAL-TIME USER TRACKING */}
                {activeTab === "tracking" && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-base text-white flex items-center gap-2">
                          <Activity className="w-5 h-5 text-cyan-400" />
                          রিয়েল-টাইম ভিজিটর ট্র্যাকিং (User Tracking - {userTracking.length})
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1">
                          ওয়েবসাইটের প্রতিটি ভিজিটর কোন পেজে আসছে, কত সময় কাটাচ্ছে এবং কোন ডিভাইস ব্যবহার করছে তা স্বয়ংক্রিয়ভাবে ট্র্যাক হয় এবং গুগল শিটের <strong>"user tracking"</strong> ট্যাবে সিঙ্ক হয়।
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={fetchTrackingData}
                          disabled={isLoadingTracking}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 text-xs font-semibold cursor-pointer transition-colors"
                          title="ট্র্যাকিং লগ রিফ্রেশ করুন"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTracking ? "animate-spin" : ""}`} />
                          <span>{isLoadingTracking ? "রিফ্রেশ হচ্ছে..." : "রিফ্রেশ"}</span>
                        </button>
                        <button
                          onClick={handleTestTrackingWebhook}
                          disabled={isTestingTrackingWebhook}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors"
                          title="গুগল শিটের user tracking ট্যাবে টেস্ট ডেটা পাঠান"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{isTestingTrackingWebhook ? "পাঠানো হচ্ছে..." : "🧪 টেস্ট ট্র্যাকিং"}</span>
                        </button>
                        <button
                          onClick={exportTrackingToCsv}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold cursor-pointer transition-colors"
                          title="CSV ফরম্যাটে সমস্ত ভিজিটর লগ ডাউনলোড করুন"
                        >
                          <Download className="w-3.5 h-3.5 text-zinc-400" />
                          <span>CSV ডাউনলোড</span>
                        </button>
                      </div>
                    </div>

                    {/* Summary Statistics Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Active Now */}
                      <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-cyan-300">সক্রিয় ভিজিটর (Active Now)</span>
                          <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-white font-display">
                          {trackingStats?.activeNow ?? 0}
                        </p>
                        <span className="text-[11px] text-cyan-400/80 mt-1 block">
                          বর্তমান সেশনে লাইভ রয়েছে
                        </span>
                      </div>

                      {/* Total Visits Tracked */}
                      <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-zinc-400">মোট ভিজিট হিস্ট্রি</span>
                          <Clock className="w-4 h-4 text-amber-400" />
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-amber-400 font-display">
                          {trackingStats?.totalVisits ?? userTracking.length}
                        </p>
                        <span className="text-[11px] text-zinc-500 mt-1 block">
                          রেকর্ডকৃত পেজ ভিউ
                        </span>
                      </div>

                      {/* Top Page */}
                      <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-zinc-400">শীর্ষ ভিউ পেজ</span>
                          <Compass className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="mt-2 text-sm font-bold text-white truncate" title={Object.keys(trackingStats?.pageStats || {})[0] || "হোমপেজ"}>
                          {Object.keys(trackingStats?.pageStats || {})[0] || "হোমপেজ (Home)"}
                        </p>
                        <span className="text-[11px] text-zinc-500 mt-1 block">
                          সর্বাধিক ভিজিট হচ্ছে
                        </span>
                      </div>

                      {/* Device Split */}
                      <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-zinc-400">প্রধান ডিভাইস</span>
                          <Monitor className="w-4 h-4 text-purple-400" />
                        </div>
                        <p className="mt-2 text-sm font-bold text-purple-300 truncate">
                          {Object.keys(trackingStats?.deviceStats || {})[0] || "Desktop / PC"}
                        </p>
                        <span className="text-[11px] text-zinc-500 mt-1 block">
                          ডিভাইস শনাক্তকরণ
                        </span>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="পেজ, আইপি, লোকেশন, ডিভাইস, ব্রাউজার বা সেশন আইডি দিয়ে খুঁজুন..."
                        value={trackingSearchTerm}
                        onChange={(e) => setTrackingSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    {/* Tracking Logs List Content */}
                    {isLoadingTracking ? (
                      <div className="py-12 flex flex-col items-center justify-center text-zinc-400">
                        <RefreshCw className="w-6 h-6 animate-spin text-cyan-500 mb-2" />
                        <span className="text-xs">ট্র্যাকিং ডেটা লোড হচ্ছে...</span>
                      </div>
                    ) : userTracking.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl bg-zinc-800/40 border border-zinc-800 space-y-3">
                        <Activity className="w-10 h-10 text-cyan-500/50 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-zinc-300">এখনও কোনো ভিজিটর লগ যুক্ত হয়নি</p>
                        <p className="text-xs text-zinc-500 max-w-md mx-auto">
                          ভিজিটররা ওয়েবসাইটে প্রবেশ করলে তাদের প্রতিটি সেশন স্বয়ংক্রিয়ভাবে এখানে এবং গুগল শিটের <strong>"user tracking"</strong> ট্যাবে যুক্ত হবে।
                        </p>
                        <button
                          onClick={handleTestTrackingWebhook}
                          disabled={isTestingTrackingWebhook}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>একটি টেস্ট ভিজিটর লগ তৈরি করুন</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Desktop Table View (11 Columns matching user's spreadsheet) */}
                        <div className="hidden lg:block overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 scrollbar-thin scrollbar-thumb-zinc-700">
                          <table className="w-full text-left text-xs text-zinc-300 min-w-[950px]">
                            <thead className="bg-zinc-800/90 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-700">
                              <tr>
                                <th className="py-3 px-3">#</th>
                                <th className="py-3 px-3">তারিখ ও সময় (Time)</th>
                                <th className="py-3 px-3">পেজ (Page)</th>
                                <th className="py-3 px-3">আইপি (IP)</th>
                                <th className="py-3 px-3">লোকেশন (Location)</th>
                                <th className="py-3 px-3">ডিভাইস (Device)</th>
                                <th className="py-3 px-3">অপারেটিং সিস্টেম (OS)</th>
                                <th className="py-3 px-3">ব্রাউজার (Browser)</th>
                                <th className="py-3 px-3">সাইটে থাকার সময় (Time Spent)</th>
                                <th className="py-3 px-3">কোথা থেকে এসেছে (Referrer)</th>
                                <th className="py-3 px-3">স্ক্রিন রেজুলেশন</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                              {userTracking
                                .filter((t) => {
                                  if (!trackingSearchTerm.trim()) return true;
                                  const term = trackingSearchTerm.toLowerCase();
                                  return (
                                    t.page.toLowerCase().includes(term) ||
                                    t.ip.toLowerCase().includes(term) ||
                                    t.location.toLowerCase().includes(term) ||
                                    t.device.toLowerCase().includes(term) ||
                                    t.os.toLowerCase().includes(term) ||
                                    t.browser.toLowerCase().includes(term) ||
                                    t.referrer.toLowerCase().includes(term) ||
                                    t.sessionId.toLowerCase().includes(term)
                                  );
                                })
                                .map((track, idx) => (
                                  <tr key={track.sessionId + idx} className="hover:bg-zinc-800/40 transition-colors">
                                    <td className="py-3 px-3 font-mono text-zinc-500 text-[11px]">{idx + 1}</td>
                                    <td className="py-3 px-3 text-zinc-300 font-mono text-[11px] whitespace-nowrap">
                                      {track.time}
                                    </td>
                                    <td className="py-3 px-3">
                                      <span className="font-semibold text-white truncate max-w-[160px] block" title={track.page}>
                                        {track.page}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 font-mono text-zinc-400 text-[11px] whitespace-nowrap">
                                      {track.ip}
                                    </td>
                                    <td className="py-3 px-3">
                                      <span className="inline-flex items-center gap-1 text-zinc-300 text-[11px]">
                                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                                        <span>{track.location}</span>
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-zinc-300 whitespace-nowrap">
                                      <span className="inline-flex items-center gap-1">
                                        <Smartphone className="w-3 h-3 text-purple-400 shrink-0" />
                                        <span>{track.device}</span>
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-zinc-400 text-[11px] whitespace-nowrap">
                                      {track.os}
                                    </td>
                                    <td className="py-3 px-3 text-zinc-400 text-[11px] whitespace-nowrap">
                                      {track.browser}
                                    </td>
                                    <td className="py-3 px-3 whitespace-nowrap">
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                          track.timeSpent.includes("Active") || track.timeSpent.includes("সক্রিয়")
                                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 animate-pulse"
                                            : "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                                        }`}
                                      >
                                        <Clock className="w-2.5 h-2.5 mr-1" />
                                        {track.timeSpent}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-zinc-400 text-[11px] truncate max-w-[120px]" title={track.referrer}>
                                      {track.referrer}
                                    </td>
                                    <td className="py-3 px-3 font-mono text-zinc-400 text-[11px] whitespace-nowrap">
                                      {track.screen}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Responsive Cards */}
                        <div className="lg:hidden space-y-3">
                          {userTracking
                            .filter((t) => {
                              if (!trackingSearchTerm.trim()) return true;
                              const term = trackingSearchTerm.toLowerCase();
                              return (
                                t.page.toLowerCase().includes(term) ||
                                t.ip.toLowerCase().includes(term) ||
                                t.location.toLowerCase().includes(term) ||
                                t.device.toLowerCase().includes(term) ||
                                t.os.toLowerCase().includes(term) ||
                                t.browser.toLowerCase().includes(term) ||
                                t.referrer.toLowerCase().includes(term) ||
                                t.sessionId.toLowerCase().includes(term)
                              );
                            })
                            .map((track, idx) => (
                              <div
                                key={track.sessionId + idx}
                                className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/80 space-y-2.5"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                                    <span className="font-mono text-zinc-400">#{idx + 1}</span>
                                    <span className="truncate max-w-[200px]">{track.page}</span>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                      track.timeSpent.includes("Active") || track.timeSpent.includes("সক্রিয়")
                                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 animate-pulse"
                                        : "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                                    }`}
                                  >
                                    {track.timeSpent}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-zinc-700/50">
                                  <div>
                                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">আইপি ও অবস্থান</span>
                                    <span className="font-mono text-zinc-300">{track.ip}</span>
                                    <div className="text-zinc-400 flex items-center gap-1">
                                      <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                                      <span>{track.location}</span>
                                    </div>
                                  </div>

                                  <div>
                                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">ডিভাইস ও ওএস</span>
                                    <span className="text-zinc-300">{track.device}</span>
                                    <div className="text-zinc-400">{track.os} ({track.browser})</div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1 border-t border-zinc-700/30">
                                  <span>{track.time}</span>
                                  <span>রেজুলেশন: {track.screen}</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: GOOGLE SHEETS INTEGRATION HUB */}
                {activeTab === "sheets" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                        Google Sheets অটো সিঙ্ক (order sheet, Customers, subscribe ও user traking ট্যাব)
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        অর্ডার হলে <strong>order sheet</strong> ট্যাবে, গ্রাহক নিবন্ধনে <strong>Customers</strong> ট্যাবে, নিউজলেটার সাবস্ক্রাইব হলে <strong>subscribe</strong> ট্যাবে এবং ওয়েবসাইট ভিজিটরদের লাইভ তথ্য সম্পূর্ণ আলাদা <strong>user traking</strong> ট্যাবে স্বয়ংক্রিয়ভাবে যুক্ত হবে।
                      </p>
                    </div>

                    {/* Dedicated Sync, Save & Delete Management Hub */}
                    <div className="p-5 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 space-y-4 shadow-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-700/60">
                        <div>
                          <h4 className="font-bold text-sm text-white flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-sky-400" />
                            <span>গুগল শিট থেকে ডেটা সিঙ্ক ও সংরক্ষণ কন্ট্রোল (Pull-Only Sync & Storage)</span>
                          </h4>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            শিট থেকে সিঙ্ক করলে অর্ডার, কাস্টমার, সাবস্ক্রাইব ও ট্র্যাকিং ডেটা সাময়িকভাবে আসবে। আপনি না চাইলে সেভ হবে না।
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            isLiveSheetMode && !isSyncedDataSaved
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : isSyncedDataSaved
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}>
                            {isLiveSheetMode && !isSyncedDataSaved
                              ? "প্রিভিউ মোড (অসংরক্ষিত)"
                              : isSyncedDataSaved
                              ? "অ্যাডমিনে সংরক্ষিত (Saved)"
                              : "কোনো ডেটা সংরক্ষিত নেই"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* 1. Sync / Preview */}
                        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-750 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                              <RefreshCw className={`w-4 h-4 ${isSyncingFromSheets ? "animate-spin" : ""}`} />
                              <span>১. শিট থেকে সিঙ্ক (Pull Data)</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                              গুগল শিটের ৪টি ট্যাব থেকে সব ডেটা টেনে আনবে। বের হওয়ার সাথে সাথে মুছে যাবে (অটো প্রিভিউ)।
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleSyncFromGoogleSheets}
                            disabled={isSyncingFromSheets}
                            className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-95"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFromSheets ? "animate-spin" : ""}`} />
                            <span>{isSyncingFromSheets ? "সিঙ্ক হচ্ছে..." : "শিট থেকে সিঙ্ক করুন"}</span>
                          </button>
                        </div>

                        {/* 2. Save Button */}
                        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-750 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                              <Save className="w-4 h-4" />
                              <span>২. স্থায়ীভাবে সেভ করুন (Save Data)</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                              প্রিভিউ করা ডেটা অ্যাডমিন প্যানেলে স্থায়ীভাবে রাখতে এই বাটনে চাপুন।
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleSaveSyncedData}
                            disabled={isSavingSyncedData || (!isLiveSheetMode && isSyncedDataSaved) || (orders.length === 0 && customers.length === 0 && subscribers.length === 0 && userTracking.length === 0)}
                            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-95"
                          >
                            <Save className={`w-3.5 h-3.5 ${isSavingSyncedData ? "animate-spin" : ""}`} />
                            <span>{isSavingSyncedData ? "সেভ হচ্ছে..." : "💾 অ্যাডমিনে সেভ করুন"}</span>
                          </button>
                        </div>

                        {/* 3. Delete / Clear Button */}
                        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-750 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                              <Trash2 className="w-4 h-4" />
                              <span>৩. সেভ ডেটা মুছুন (Clear Saved)</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                              অ্যাডমিন প্যানেল সম্পূর্ণ পরিষ্কার করে ফেলবে। গুগল শিটের মূল রেকর্ড ১০০% অক্ষত থাকবে।
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowClearConfirmModal(true)}
                            disabled={!isSyncedDataSaved && !isLiveSheetMode}
                            className="w-full py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-rose-300 font-bold text-xs transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>সেভ করা ডেটা মুছুন</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Webhook Input Box */}
                    <div className="p-5 rounded-2xl bg-zinc-800/60 border border-zinc-700 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Google Apps Script Webhook URL
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <input
                            type="url"
                            placeholder="https://script.google.com/macros/s/.../exec"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            className="flex-1 min-w-[240px] px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            onClick={handleSaveWebhook}
                            disabled={isSavingWebhook}
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-colors"
                          >
                            {isSavingWebhook ? "Saving..." : "Save URL"}
                          </button>
                          <button
                            onClick={handleTestWebhook}
                            disabled={isTestingWebhook || isTestingSubscribeWebhook || isTestingTrackingWebhook || isCleaningOrderSheet}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white font-bold text-xs transition-colors"
                            title="অর্ডার ডেটা টেস্ট করতে চাপুন"
                          >
                            <Send className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{isTestingWebhook ? "অর্ডার টেস্ট..." : "🧪 টেস্ট অর্ডার"}</span>
                          </button>
                          <button
                            onClick={handleTestSubscribeWebhook}
                            disabled={isTestingWebhook || isTestingSubscribeWebhook || isTestingTrackingWebhook || isCleaningOrderSheet}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 disabled:opacity-50 text-amber-200 font-bold text-xs transition-colors"
                            title="সাবস্ক্রাইব ডেটা টেস্ট করতে চাপুন"
                          >
                            <Mail className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isTestingSubscribeWebhook ? "সাবস্ক্রাইব টেস্ট..." : "📧 টেস্ট সাবস্ক্রাইব"}</span>
                          </button>
                          <button
                            onClick={handleTestTrackingWebhook}
                            disabled={isTestingWebhook || isTestingSubscribeWebhook || isTestingTrackingWebhook || isTestingEmailAlert || isCleaningOrderSheet}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 disabled:opacity-50 text-cyan-200 font-bold text-xs transition-colors"
                            title="ইউজার ট্র্যাকিং ডেটা টেস্ট করতে চাপুন"
                          >
                            <Activity className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{isTestingTrackingWebhook ? "ট্র্যাকিং টেস্ট..." : "🧪 টেস্ট ট্র্যাকিং"}</span>
                          </button>
                          <button
                            onClick={handleTestEmailAlert}
                            disabled={isTestingWebhook || isTestingSubscribeWebhook || isTestingTrackingWebhook || isTestingEmailAlert || isCleaningOrderSheet}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 disabled:opacity-50 text-purple-200 font-bold text-xs transition-colors"
                            title="adib1234@gmail.com এ টেস্ট অর্ডার নোটিফিকেশন ইমেইল পাঠান"
                          >
                            <Mail className="w-3.5 h-3.5 text-purple-400" />
                            <span>{isTestingEmailAlert ? "ইমেইল টেস্ট..." : "📩 টেস্ট জিমেইল এলার্ট"}</span>
                          </button>
                          <button
                            onClick={handleCleanOrderSheet}
                            disabled={isTestingWebhook || isTestingSubscribeWebhook || isTestingTrackingWebhook || isTestingEmailAlert || isCleaningOrderSheet || isFixingCustomersSheet}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 disabled:opacity-50 text-rose-200 font-bold text-xs transition-colors"
                            title="অর্ডার শিট থেকে ভুল করে ঢুকে যাওয়া ট্র্যাকিং রো মুছে 'user traking' এ স্থানান্তর করতে চাপুন"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>{isCleaningOrderSheet ? "ক্লিন হচ্ছে..." : "🧹 অর্ডার শিট ক্লিন করুন"}</span>
                          </button>
                          <button
                            onClick={handleFixCustomersSheet}
                            disabled={isTestingWebhook || isTestingSubscribeWebhook || isTestingTrackingWebhook || isTestingEmailAlert || isCleaningOrderSheet || isFixingCustomersSheet}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 disabled:opacity-50 text-amber-200 font-bold text-xs transition-colors"
                            title="Customers শিটের হেডার (Customer ID, Registration Date, Name, Phone, Email, Address, Password) ঠিক করুন এবং ভুল অর্ডারগুলো সরান"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isFixingCustomersSheet ? "animate-spin" : ""}`} />
                            <span>{isFixingCustomersSheet ? "ঠিক হচ্ছে..." : "🔧 কাস্টমার শিট হেডার ফিক্স"}</span>
                          </button>
                        </div>
                        <div className="mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between flex-wrap gap-2 text-xs text-emerald-200">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                            <span>
                              <strong>লাইভ জিমেইল নোটিফিকেশন সক্রিয়:</strong> কেউ অর্ডার করলেই স্বয়ংক্রিয়ভাবে <code className="bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-300 font-mono">adib1234@gmail.com</code> এবং গুগল শিটে সাথে সাথে অর্ডার ও প্রোডাক্ট কোড চলে যাবে।
                            </span>
                          </div>
                          <span className="text-[11px] text-emerald-400/80 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                            ⚡ 100% অটোমেটিক লাইভ
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1.5">
                          You can also save this into your <code>.env</code> file under <code>GOOGLE_SHEET_WEBHOOK_URL</code>.
                        </p>
                      </div>
                    </div>

                      {/* CRITICAL WARNING BOX: HOW TO DEPLOY NEW SCRIPT VERSION */}
                      <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-xs text-amber-200 space-y-3 shadow-lg">
                        <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                          <span>⚠️ জিমেইলে অর্ডার ডাটা যাওয়ার জন্য ২টি সহজ কাজ সম্পন্ন করুন</span>
                        </div>
                        
                        <div className="space-y-2 text-zinc-200">
                          <div className="p-3 bg-zinc-900/90 rounded-xl border border-emerald-500/40 space-y-1.5">
                            <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                              <span>✅ কাজ ১ (সবচেয়ে সহজ - ১ ক্লিকে জিমেইল চালু):</span>
                            </div>
                            <p className="text-[12px] text-zinc-300 leading-relaxed">
                              আমরা আপনার ইমেইলে (<strong className="text-white">adib1234@gmail.com</strong> / <strong className="text-white">adib1234w@gmail.com</strong>) একটি <strong className="text-emerald-300">"Activate Form"</strong> লিংক পাঠিয়েছি। জিমেইল ইনবক্স বা স্প্যাম ফোল্ডার খুলে লিংকে একবার ক্লিক করলেই ওয়েবসাইট থেকে যেকোনো অর্ডার সরাসরি আপনার জিমেইলে চলে আসবে!
                            </p>
                          </div>

                          <div className="p-3 bg-zinc-900/90 rounded-xl border border-amber-500/40 space-y-2">
                            <div className="text-amber-300 font-bold text-xs flex items-center gap-1.5">
                              <span>⚡ কাজ ২ (গুগল শিট থেকে অটো-ইমেইল চালু করার নিয়ম):</span>
                            </div>
                            <p className="text-[11px] text-zinc-300 leading-relaxed">
                              গুগল শিট স্ক্রিপ্ট এডিটরে নিচের সম্পূর্ণ নতুন কোডটি পেস্ট করার পর জিমেইল পারমিশন ও ডিপ্লয় করতে নিচের ধাপগুলো করুন:
                            </p>
                            <div className="font-mono text-[11px] text-amber-200 space-y-1.5 pl-1">
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-amber-400">১.</span>
                                <span>উপরে ফাংশন ড্রপডাউনে <strong className="text-emerald-300">authorizeAndTestEmail</strong> সিলেক্ট করে <strong>▶️ Run</strong> এ ক্লিক করুন।</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-amber-400">২.</span>
                                <span>Google পপ-আপ আসলে <strong>Review Permissions</strong> &gt; আপনার Gmail সিলেক্ট করুন &gt; <strong>Advanced</strong> &gt; <strong>Go to Untitled project (unsafe)</strong> &gt; <strong>Allow</strong> দিন।</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-amber-400">৩.</span>
                                <span>এরপর ওপরে ডানে <strong>Deploy</strong> &gt; <strong>Manage deployments</strong> &gt; <strong>Edit (পেন্সিল আইকন)</strong> এ ক্লিক করুন।</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-amber-400">৪.</span>
                                <span><strong>Version</strong> ড্রপডাউনে <strong>New version</strong> সিলেক্ট করে নিচে <strong>Deploy</strong> বাটনে ক্লিক করে দিন। ব্যাস!</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-zinc-400">
                          এরপর উপরের <strong className="text-purple-400">📩 টেস্ট জিমেইল এলার্ট</strong> এবং <strong className="text-emerald-400">🧪 টেস্ট অর্ডার</strong> বাটনে ক্লিক করে সাথে সাথে চেক করে নিন।
                        </p>
                      </div>

                      {/* 30-Second Setup Guide with Copyable Script */}
                      <div className="p-5 rounded-2xl bg-zinc-800/40 border border-zinc-700 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-white">
                            Ready-to-Deploy Google Apps Script Code (Updated for Orders + Subscribe)
                          </h4>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(sampleAppsScriptCode);
                              setCopiedScript(true);
                              setTimeout(() => setCopiedScript(false), 2500);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-xs font-bold text-white transition-colors"
                          >
                            {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedScript ? "Copied!" : "Copy Script"}</span>
                          </button>
                        </div>

                        <ol className="text-xs text-zinc-300 space-y-1 list-decimal list-inside leading-relaxed">
                          <li>Create or open your Google Sheet at <strong>sheets.google.com</strong>.</li>
                          <li>Click <strong>Extensions &gt; Apps Script</strong>.</li>
                          <li>Select all existing code in <code>Code.gs</code>, delete it, and paste the code snippet below.</li>
                          <li>Click <strong>Deploy &gt; Manage deployments &gt; Edit &gt; Version: New version &gt; Deploy</strong>.</li>
                          <li>(প্রথমবার হলে: <strong>Deploy &gt; New deployment &gt; Web app</strong>, <em>Execute as:</em> <strong>Me</strong>, <em>Who has access:</em> <strong>Anyone</strong>).</li>
                          <li>Copy the generated Web App URL and paste it into the field above!</li>
                        </ol>

                        <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-56">
                          {sampleAppsScriptCode}
                        </pre>
                      </div>
                  </div>
                )}

                {/* TAB 5: GITHUB DIRECT AUTO-SYNC */}
                {activeTab === "github" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-2">
                        <Github className="w-5 h-5 text-purple-400" />
                        GitHub সিঙ্ক ও সাইট আপডেট (GitHub Live Sync Hub)
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        আপনার স্টোরটি <strong>GitHub Pages</strong>-এ হোস্ট করা। নিচের যে কোনো একটি সহজ উপায়ে সাইট লাইভ আপডেট করতে পারবেন:
                      </p>
                    </div>

                    {/* METHOD 1: 100% GUARANTEED ZERO-TOKEN 30-SECOND UPDATE */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 border-2 border-emerald-500/50 space-y-4 shadow-xl">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40">
                            পদ্ধতি ১ (সবচেয়ে সহজ ও ১০০% নিশ্চিত)
                          </span>
                          <span className="text-xs text-zinc-400">কোনো টোকেন বা ঝামেলা লাগবে না</span>
                        </div>
                        <span className="text-emerald-400 font-bold text-xs">সময়: মাত্র ৩০ সেকেন্ড</span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-white flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          টোকেন ছাড়া সরাসরি GitHub-এ কপি-পেস্ট করে লাইভ আপডেট
                        </h4>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          টোকেন তৈরি বা এরর এড়াতে নিচের ৩টি সহজ ক্লিকে সাইট <code>nirapodkroy.shop</code> আপডেট করে ফেলুন:
                        </p>
                      </div>

                      {/* Quick 3-Step Action Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                        {/* Step 1: Copy JSON */}
                        <div className="p-4 rounded-xl bg-zinc-900/90 border border-emerald-500/30 flex flex-col justify-between gap-3">
                          <div className="space-y-1.5">
                            <span className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-emerald-900/80 text-emerald-300 flex items-center justify-center text-[11px] font-bold border border-emerald-500/40">১</span>
                              JSON কোড কপি করুন
                            </span>
                            <p className="text-[11px] text-zinc-400">
                              সকল {adminProducts.length}টি পণ্যের ডেটা ১ ক্লিকেই ক্লিপবোর্ডে কপি হবে।
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyProductsJson}
                            className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors"
                          >
                            {copiedJson ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedJson ? "কপি সম্পন্ন হয়েছে!" : "১-ক্লিকে কোড কপি করুন"}</span>
                          </button>
                        </div>

                        {/* Step 2: Open GitHub Editor */}
                        <div className="p-4 rounded-xl bg-zinc-900/90 border border-emerald-500/30 flex flex-col justify-between gap-3">
                          <div className="space-y-1.5">
                            <span className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-emerald-900/80 text-emerald-300 flex items-center justify-center text-[11px] font-bold border border-emerald-500/40">২</span>
                              GitHub-এ ফাইলটি খুলুন
                            </span>
                            <p className="text-[11px] text-zinc-400">
                              সরাসরি <code>products.json</code> ফাইলের এডিট পেজ খুলে যাবে।
                            </p>
                          </div>
                          <a
                            href={`https://github.com/${githubRepo.trim()}/edit/${githubBranch.trim()}/public/products.json`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-zinc-700 hover:border-emerald-500/50 transition-colors"
                          >
                            <span>GitHub-এ এডিটর খুলুন</span>
                            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                          </a>
                        </div>

                        {/* Step 3: Paste & Commit */}
                        <div className="p-4 rounded-xl bg-zinc-900/90 border border-emerald-500/30 flex flex-col justify-between gap-3">
                          <div className="space-y-1.5">
                            <span className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-emerald-900/80 text-emerald-300 flex items-center justify-center text-[11px] font-bold border border-emerald-500/40">৩</span>
                              পেস্ট করে সেভ করুন
                            </span>
                            <p className="text-[11px] text-zinc-400">
                              আগের লেখা মুছে পেস্ট করুন (Ctrl+V), তারপর নিচে সবুজ <strong>Commit changes</strong> বাটনে চাপুন।
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleExportProductsJson}
                            className="w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>বা ফাইল ডাউনলোড করুন</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* METHOD 2: 1-CLICK AUTOMATIC PUSH WITH GITHUB TOKEN */}
                    <div className="pt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/40">
                          পদ্ধতি ২ (টোকেন দিয়ে অটোমেটিক পুশ)
                        </span>
                        <span className="text-xs text-zinc-400">GitHub Personal Access Token (PAT) দিয়ে</span>
                      </div>
                    </div>

                    {/* Push Now Primary Action Card */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-zinc-900 to-zinc-900 border border-purple-500/30 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
                            <h4 className="font-bold text-sm text-white">
                              ১-ক্লিক GitHub অটো-ডিপ্লয় (Push to GitHub)
                            </h4>
                          </div>
                          <p className="text-xs text-zinc-300 mt-1">
                            বর্তমান ক্যাটালগের <strong>{adminProducts.length}টি পণ্য</strong> সরাসরি <code>public/products.json</code> ফাইলে কমিট হবে।
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handlePushToGithub}
                          disabled={isPushingToGithub}
                          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-purple-900/30 transition-all cursor-pointer shrink-0"
                        >
                          <Github className={`w-4 h-4 ${isPushingToGithub ? "animate-spin" : ""}`} />
                          <span>{isPushingToGithub ? "গিটহাবে পুশ ও কমিট হচ্ছে..." : "এখনই GitHub-এ সেভ ও পুশ করুন"}</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-500/20 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400">লাইভ বিল্ড ট্র্যাকিং:</span>
                          <a
                            href={`https://github.com/${githubRepo.trim()}/actions`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 hover:underline font-medium"
                          >
                            <span>GitHub Actions বিল্ড স্ট্যাটাস দেখুন</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {lastGithubCommitUrl && (
                          <a
                            href={lastGithubCommitUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:underline font-mono text-[11px]"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>সর্বশেষ সফল কমিট ({lastGithubSyncTime || "সম্পন্ন"})</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* What Happens When You Push to GitHub Explain Card */}
                    <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/70 space-y-2.5 text-xs">
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        GitHub-এ পুশ করলে কী ঘটে? (How Auto-Deploy Works)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[12px] pt-1">
                        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-purple-300">
                            <span className="w-5 h-5 rounded-full bg-purple-900/60 text-purple-300 flex items-center justify-center text-[11px] border border-purple-500/40">১</span>
                            <span>ডেটা প্যাকেজিং</span>
                          </div>
                          <p className="text-zinc-400 leading-relaxed">
                            অ্যাডমিনের সকল পণ্য ও ক্যাটাগরি স্বয়ংক্রিয়ভাবে ক্লিন UTF-8 JSON ফরম্যাটে রূপান্তর করা হয়।
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-blue-300">
                            <span className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-300 flex items-center justify-center text-[11px] border border-blue-500/40">২</span>
                            <span>GitHub API কমিট</span>
                          </div>
                          <p className="text-zinc-400 leading-relaxed">
                            GitHub REST API দিয়ে সরাসরি আপনার রিপোজিটরির <code>public/products.json</code> ফাইলে নতুন কমিট তৈরি হয়।
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                            <span className="w-5 h-5 rounded-full bg-emerald-900/60 text-emerald-300 flex items-center justify-center text-[11px] border border-emerald-500/40">৩</span>
                            <span>স্বয়ংক্রিয় লাইভ ডিপ্লয়</span>
                          </div>
                          <p className="text-zinc-400 leading-relaxed">
                            কমিট হওয়ার সাথে সাথে GitHub Actions ১ মিনিটের মধ্যে <code>nirapodkroy.shop</code> সাইট লাইভ আপডেট করে।
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* GitHub Configuration Form */}
                    <div className="p-5 rounded-2xl bg-zinc-800/60 border border-zinc-700 space-y-4">
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-purple-400" />
                        GitHub একাউন্ট ও রিপোজিটরি কনফিগারেশন
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-zinc-300 font-semibold mb-1">
                            GitHub Repository (owner/repo)
                          </label>
                          <input
                            type="text"
                            value={githubRepo}
                            onChange={(e) => setGithubRepo(e.target.value)}
                            placeholder="nirapodkroy/Nirapod-kroy.shop"
                            className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-mono focus:ring-1 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-300 font-semibold mb-1">
                            Branch
                          </label>
                          <input
                            type="text"
                            value={githubBranch}
                            onChange={(e) => setGithubBranch(e.target.value)}
                            placeholder="main"
                            className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-mono focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-zinc-300 font-semibold text-xs">
                            GitHub Personal Access Token (PAT)
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowGithubToken(!showGithubToken)}
                            className="text-[11px] text-zinc-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                          >
                            {showGithubToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showGithubToken ? "লুকান" : "দেখান"}</span>
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showGithubToken ? "text" : "password"}
                            value={githubToken}
                            onChange={(e) => setGithubToken(e.target.value)}
                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                            className="w-full px-3.5 py-2.5 pr-10 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-purple-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGithubToken(!showGithubToken)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 cursor-pointer"
                          >
                            {showGithubToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          আপনার টোকেনটি শুধুমাত্র আপনার ব্রাউজারের নিরাপদ স্টোরেজে সংরক্ষিত থাকে।
                        </p>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleSaveGithubSettings(false)}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          টোকেন ও সেটিংস সংরক্ষণ করুন
                        </button>
                        <button
                          type="button"
                          onClick={handleTestGithubConnection}
                          disabled={isTestingGithubConnection}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white font-bold text-xs transition-colors cursor-pointer border border-zinc-600"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isTestingGithubConnection ? "animate-spin text-purple-400" : "text-zinc-300"}`} />
                          <span>{isTestingGithubConnection ? "কানেকশন যাচাই করা হচ্ছে..." : "কানেকশন টেস্ট করুন (Test)"}</span>
                        </button>
                        <a
                          href="https://github.com/settings/tokens/new?description=Nirapod+Admin+Sync&scopes=repo"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium text-xs transition-colors border border-zinc-700"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>নতুন টোকেন পেজে যান</span>
                        </a>
                      </div>

                      {/* Connection Test Result Box */}
                      {githubConnectionInfo.status !== "idle" && (
                        <div
                          className={`p-3.5 rounded-xl border text-xs space-y-1 transition-all ${
                            githubConnectionInfo.status === "success"
                              ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                              : "bg-red-950/30 border-red-500/40 text-red-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold">
                            {githubConnectionInfo.status === "success" ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            )}
                            <span>{githubConnectionInfo.message}</span>
                          </div>
                          {githubConnectionInfo.details && (
                            <p className="text-[11px] opacity-90 pl-6">
                              {githubConnectionInfo.details}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 2-Minute Step-by-Step Guide */}
                    <div className="p-5 rounded-2xl bg-zinc-800/40 border border-zinc-700 space-y-3 text-xs">
                      <h4 className="font-bold text-sm text-white">
                        সহজ ২-মিনিটের গাইড: কিভাবে GitHub Personal Access Token পাবেন?
                      </h4>
                      <ol className="text-zinc-300 space-y-2 list-decimal list-inside leading-relaxed">
                        <li>
                          উপরে দেওয়া <strong>"টোকেন তৈরি করার পেজে যান"</strong> বাটনে ক্লিক করুন (অথবা GitHub Settings &gt; Developer settings &gt; Personal access tokens &gt; Tokens classic-এ যান)।
                        </li>
                        <li>
                          Note বক্সে নাম দিন: <code>Nirapod Admin</code>
                        </li>
                        <li>
                          <strong>Select scopes</strong> থেকে <strong>repo</strong> চেকবক্সে টিক দিন (যাতে products.json ফাইলে সেভ করতে পারে)।
                        </li>
                        <li>
                          নিচে গিয়ে <strong>Generate token</strong> বাটনে চাপুন এবং সবুজ রঙের টোকেনটি কপি করুন।
                        </li>
                        <li>
                          কপি করা টোকেনটি উপরের বক্সে পেস্ট করে <strong>"টোকেন সংরক্ষণ করুন"</strong> চাপুন। ব্যাস! এরপর থেকে প্রতিবার শুধু ১ ক্লিকেই GitHub-এ লাইভ আপডেট হয়ে যাবে!
                        </li>
                      </ol>
                    </div>

                    {/* Alternative Manual Options */}
                    <div className="p-5 rounded-2xl bg-zinc-800/30 border border-zinc-700/60 space-y-3 text-xs">
                      <h4 className="font-bold text-sm text-zinc-200">
                        বিকল্প সহজ উপায় (টোকেন ছাড়া ম্যানুয়াল পদ্ধতি):
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                          <span className="font-bold text-white block">পদ্ধতি ১: JSON ব্যাকআপ ডাউনলোড</span>
                          <p className="text-[11px] text-zinc-400">
                            এডমিন থেকে JSON ব্যাকআপ নামিয়ে আপনার GitHub রিপোজিটরির <code>public</code> ফোল্ডারে আপলোড করে দিন।
                          </p>
                          <button
                            type="button"
                            onClick={handleExportProductsJson}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs border border-zinc-700 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-zinc-400" />
                            <span>products.json ডাউনলোড</span>
                          </button>
                        </div>

                        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                          <span className="font-bold text-white block">পদ্ধতি ২: সরাসরি GitHub-এ এডিট</span>
                          <p className="text-[11px] text-zinc-400">
                            সরাসরি আপনার GitHub রিপোজিটরির <code>public/products.json</code> ফাইলে গিয়ে Edit (পেন্সিল আইকন) দিয়ে Commit দিন।
                          </p>
                          <a
                            href={`https://github.com/${githubRepo.trim()}/edit/${githubBranch.trim()}/public/products.json`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs border border-zinc-700"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                            <span>GitHub-এ ফাইলটি এডিট করুন</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-Modal: Add / Edit Product */}
          {isProductFormOpen && (
            <div className="fixed inset-0 z-[60] flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto overscroll-contain">
              <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-4 sm:p-6 max-w-lg w-full max-h-[92dvh] overflow-y-auto space-y-4 my-auto overscroll-contain">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                  <h3 className="font-bold text-base text-white">
                    {editingProduct ? "Edit Product" : "Add New Catalog Product"}
                  </h3>
                  <button
                    onClick={() => {
                      stopCamera();
                      setIsProductFormOpen(false);
                    }}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
                  {/* PROMINENT ACTIVE / INACTIVE VISIBILITY SELECTOR */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${
                      formIsActive
                        ? "bg-emerald-950/40 border-emerald-500/50 shadow-xs"
                        : "bg-zinc-800/80 border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              formIsActive ? "bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse" : "bg-zinc-500"
                            }`}
                          />
                          <span className="font-bold text-xs text-white">
                            {formIsActive
                              ? "Active Status (ওয়েবসাইটে লাইভ প্রদর্শিত হবে)"
                              : "Inactive Status (ওয়েবসাইট থেকে লুকানো থাকবে)"}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-300 mt-1 leading-normal">
                          {formIsActive
                            ? "✅ সক্রিয়: কাস্টমাররা এই পণ্যটি সরাসরি দেখতে এবং এখনই অর্ডার করতে পারবেন।"
                            : "🔒 নিষ্ক্রিয়: পণ্যটি স্টোর ক্যাটালগ থেকে সাময়িক লুকানো থাকবে, এডমিনে সংরক্ষিত থাকবে।"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFormIsActive(!formIsActive)}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                          formIsActive ? "bg-emerald-500" : "bg-zinc-700"
                        }`}
                        title={formIsActive ? "Click to set Inactive" : "Click to set Active"}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formIsActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-300 mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Apex Studio ANC Headphones"
                      className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Comprehensive Category Configuration Card */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950 border border-zinc-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ক্যাটাগরি নির্ধারণ (Category Configuration) *</span>
                      </label>
                      <span className="text-[10px] text-zinc-400">
                        {categoryClassification === "main" ? "প্রধান ক্যাটাগরি মোড" : "সাব-ক্যাটাগরি মোড"}
                      </span>
                    </div>

                    {/* Mode Toggle Buttons: Main Category vs Sub-Category */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryClassification("main");
                          setFormParentCategory("");
                          if (!formCategory || formCategory === "__CUSTOM__") {
                            setFormCategory("Groceries & Food");
                          }
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          categoryClassification === "main"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                        }`}
                      >
                        <span>🏢 প্রধান ক্যাটাগরি (Main)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryClassification("sub");
                          if (!formParentCategory) {
                            setFormParentCategory("Groceries & Food");
                          }
                          if (!formCategory || formCategory === "Groceries & Food") {
                            setFormCategory("Honey");
                          }
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          categoryClassification === "sub"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                        }`}
                      >
                        <span>📂 সাব-ক্যাটাগরি (Sub-Category)</span>
                      </button>
                    </div>

                    {/* MAIN CATEGORY SELECTION */}
                    {categoryClassification === "main" && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300 font-medium">প্রধান ক্যাটাগরি বাছুন:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomMainCategory(!isCustomMainCategory);
                              if (!isCustomMainCategory) {
                                setCustomCategoryName("");
                              }
                            }}
                            className="text-emerald-400 hover:text-emerald-300 underline text-xs cursor-pointer font-medium"
                          >
                            {isCustomMainCategory ? "বিদ্যমান তালিকা থেকে বাছুন" : "➕ নতুন কাস্টম ক্যাটাগরি লিখুন"}
                          </button>
                        </div>

                        {!isCustomMainCategory ? (
                          <select
                            value={formCategory}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "__CUSTOM_MAIN__") {
                                setIsCustomMainCategory(true);
                                setCustomCategoryName("");
                              } else {
                                setFormCategory(val);
                              }
                            }}
                            className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-xs focus:ring-1 focus:ring-emerald-500"
                          >
                            {availableMainCategories.map((cat) => (
                              <option key={cat} value={cat}>
                                {formatCategoryDisplayLabel(cat, "bn")}
                              </option>
                            ))}
                            <option value="__CUSTOM_MAIN__">➕ নতুন কাস্টম ক্যাটাগরি লিখুন (Add Custom)...</option>
                          </select>
                        ) : (
                          <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900 border border-emerald-500/60">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-400">
                                নতুন প্রধান ক্যাটাগরির নাম লিখুন:
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsCustomMainCategory(false)}
                                className="text-[11px] text-zinc-400 hover:text-zinc-200"
                              >
                                ✕ বিদ্যমান তালিকা
                              </button>
                            </div>
                            <input
                              type="text"
                              required
                              value={customCategoryName}
                              onChange={(e) => {
                                setCustomCategoryName(e.target.value);
                                setFormCategory(e.target.value);
                              }}
                              placeholder="e.g. Traditional Craft / হস্তশিল্প ও উপহার"
                              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUB-CATEGORY SELECTION */}
                    {categoryClassification === "sub" && (
                      <div className="space-y-3 pt-1">
                        {/* 1. Parent Category Selector */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-300 font-medium">১. মূল ক্যাটাগরি (Parent Category) *</span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomParentCategory(!isCustomParentCategory);
                                if (!isCustomParentCategory) {
                                  setCustomParentCategoryName("");
                                }
                              }}
                              className="text-emerald-400 hover:text-emerald-300 underline text-xs cursor-pointer font-medium"
                            >
                              {isCustomParentCategory ? "বিদ্যমান প্যারেন্ট তালিকা" : "➕ নতুন প্যারেন্ট ক্যাটাগরি"}
                            </button>
                          </div>

                          {!isCustomParentCategory ? (
                            <select
                              value={formParentCategory}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "__CUSTOM_PARENT__") {
                                  setIsCustomParentCategory(true);
                                  setCustomParentCategoryName("");
                                } else {
                                  setFormParentCategory(val);
                                }
                              }}
                              className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-xs focus:ring-1 focus:ring-emerald-500"
                            >
                              {availableMainCategories.map((parent) => (
                                <option key={parent} value={parent}>
                                  {formatCategoryDisplayLabel(parent, "bn")}
                                </option>
                              ))}
                              <option value="__CUSTOM_PARENT__">➕ অন্য নতুন প্যারেন্ট তৈরি করুন...</option>
                            </select>
                          ) : (
                            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900 border border-emerald-500/60">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-emerald-400">
                                  নতুন প্যারেন্ট ক্যাটাগরির নাম:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setIsCustomParentCategory(false)}
                                  className="text-[11px] text-zinc-400 hover:text-zinc-200"
                                >
                                  ✕ বিদ্যমান তালিকা
                                </button>
                              </div>
                              <input
                                type="text"
                                required
                                value={customParentCategoryName}
                                onChange={(e) => {
                                  setCustomParentCategoryName(e.target.value);
                                  setFormParentCategory(e.target.value);
                                }}
                                placeholder="e.g. Groceries & Food, Fashion, অথবা নতুন নাম..."
                                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                          )}
                        </div>

                        {/* 2. Sub-category Selection & Custom Input */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-300 font-medium">২. সাব-ক্যাটাগরি নাম (Sub-Category) *</span>
                            <span className="text-[10px] text-zinc-400">বাটন চাপুন বা নিচে নাম লিখুন</span>
                          </div>

                          {/* Quick suggestion chips for subcategory */}
                          {currentSubcategorySuggestions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 py-1">
                              {currentSubcategorySuggestions.map((sub) => {
                                const isSelected = formCategory.toLowerCase().trim() === sub.toLowerCase().trim();
                                return (
                                  <button
                                    key={sub}
                                    type="button"
                                    onClick={() => {
                                      setFormCategory(sub);
                                      setCustomCategoryName(sub);
                                    }}
                                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-emerald-600 text-white border-emerald-500 font-bold shadow-xs"
                                        : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-emerald-500/50 hover:text-white"
                                    }`}
                                  >
                                    {formatCategoryDisplayLabel(sub, "bn")}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          <input
                            type="text"
                            required
                            value={formCategory}
                            onChange={(e) => {
                              setFormCategory(e.target.value);
                              setCustomCategoryName(e.target.value);
                            }}
                            placeholder="e.g. Honey, Spices, Panjabi, বা যেকোনো কাস্টম সাব-ক্যাটাগরি..."
                            className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-xs focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Live Breadcrumb Preview */}
                    <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-zinc-400 text-[11px]">সংরক্ষণ রূপরেখা:</span>
                        {categoryClassification === "sub" ? (
                          <div className="flex items-center gap-1 font-bold text-emerald-400 text-xs">
                            <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[11px]">
                              {isCustomParentCategory
                                ? customParentCategoryName || "নতুন প্যারেন্ট"
                                : formParentCategory || "Groceries & Food"}
                            </span>
                            <span className="text-zinc-500">›</span>
                            <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded text-[11px]">
                              {formCategory || "সাব-ক্যাটাগরি"}
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold text-emerald-300 bg-emerald-950 border border-emerald-500/40 px-2.5 py-0.5 rounded text-[11px]">
                            🏢 {isCustomMainCategory
                              ? customCategoryName || "নতুন প্রধান ক্যাটাগরি"
                              : formCategory || "প্রধান ক্যাটাগরি"}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        URL: <code className="text-emerald-300">/{categoryToSlug(formCategory || "category")}</code>
                      </div>
                    </div>
                  </div>

                  {/* Stock and Pricing Grid */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    <div>
                      <label className="block font-semibold text-zinc-300 mb-1 text-xs">স্টক (Stock) *</label>
                      <input
                        type="number"
                        required
                        value={formStock}
                        onChange={(e) => setFormStock(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-300 mb-1 text-xs">মূল্য (Price ৳) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder="350"
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-300 mb-1 text-xs">পূর্বমূল্য (Regular ৳)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formRegularPrice}
                        onChange={(e) => setFormRegularPrice(e.target.value)}
                        placeholder="450"
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Product Image Section: Device Multi-Upload, Web Link, or Live Camera */}
                  <div className="space-y-3 p-3.5 bg-zinc-800/80 rounded-2xl border border-zinc-700">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-zinc-200 flex items-center gap-1.5 text-xs">
                        <Images className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Product Photos (একাধিক ছবি যোগ করুন) *</span>
                      </label>
                      <span className="text-[10px] text-zinc-400">
                        {formImages.length > 0 ? `${formImages.length} photos added` : "Choose any source"}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      💡 <strong>Hover & Gallery:</strong> ১ম ছবি কভার হিসেবে থাকবে। কার্ডে মাউস রাখলে ২য় ছবি ভেসে উঠবে, এবং কাস্টমার ডিটেইলসে ক্লিক করলে সব ছবি একটার পর একটা দেখতে পারবে।
                    </p>

                    {/* Method Selector Tabs */}
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          stopCamera();
                          setImageInputMode("device");
                        }}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition-all ${
                          imageInputMode === "device"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Device Files</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          stopCamera();
                          setImageInputMode("link");
                        }}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition-all ${
                          imageInputMode === "link"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Web Link</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setImageInputMode("camera");
                          startCamera();
                        }}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition-all ${
                          imageInputMode === "camera"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Take Photo</span>
                      </button>
                    </div>

                    {/* Content for Mode 1: Device Upload (Supports multiple selection) */}
                    {imageInputMode === "device" && (
                      <div className="space-y-2 pt-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleProcessMultipleFiles(e.target.files);
                            }
                          }}
                        />

                        {/* Direct Mobile Camera Input fallback */}
                        <input
                          ref={mobileCameraInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleProcessFile(file);
                          }}
                        />

                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                              handleProcessMultipleFiles(e.dataTransfer.files);
                            }
                          }}
                          className="border-2 border-dashed border-zinc-700 hover:border-emerald-500/70 bg-zinc-900/60 hover:bg-zinc-900 rounded-xl p-4 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 group"
                        >
                          <div className="p-2.5 rounded-full bg-zinc-800 group-hover:bg-emerald-500/20 text-zinc-400 group-hover:text-emerald-400 transition-colors">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-200 group-hover:text-emerald-300 transition-colors text-xs">
                              {isProcessingImage ? "Processing photos..." : "Click to select 1 or multiple photos (একসাথে একাধিক ছবি)"}
                            </p>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              JPG, PNG, WebP • Drag & drop multiple files directly
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 py-1.5 px-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-zinc-200 font-medium flex items-center justify-center gap-1.5 transition-colors text-xs"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Browse Device (Select Multi)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => mobileCameraInputRef.current?.click()}
                            className="flex-1 py-1.5 px-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-zinc-200 font-medium flex items-center justify-center gap-1.5 transition-colors text-xs"
                            title="Direct camera snap on smartphone"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>Mobile Camera</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Content for Mode 2: Web Link */}
                    {imageInputMode === "link" && (
                      <div className="space-y-2 pt-1">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="url"
                              value={linkInputUrl}
                              onChange={(e) => setLinkInputUrl(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddLinkImage();
                                }
                              }}
                              placeholder="Paste image URL (https://...)"
                              className="w-full pl-8 pr-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:ring-1 focus:ring-emerald-500 text-xs font-mono"
                            />
                            <Link2 className="w-4 h-4 text-zinc-400 absolute left-2.5 top-2.5" />
                          </div>
                          <button
                            type="button"
                            onClick={handleAddLinkImage}
                            disabled={!linkInputUrl.trim()}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Photo</span>
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-400">
                          Paste any direct image URL (Unsplash, Daraz, Amazon CDN, etc.) and click Add. You can add multiple photos!
                        </p>
                      </div>
                    )}

                    {/* Content for Mode 3: Live Camera Capture */}
                    {imageInputMode === "camera" && (
                      <div className="space-y-2 pt-1">
                        {cameraError ? (
                          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 space-y-2 text-center">
                            <p className="text-xs">{cameraError}</p>
                            <div className="flex justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => startCamera()}
                                className="py-1 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-[11px] font-semibold"
                              >
                                Retry Camera
                              </button>
                              <button
                                type="button"
                                onClick={() => mobileCameraInputRef.current?.click()}
                                className="py-1 px-3 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg text-[11px] font-semibold"
                              >
                                Use Phone Camera App
                              </button>
                            </div>
                          </div>
                        ) : isCameraActive ? (
                          <div className="space-y-2">
                            {/* Live Video Feed with Viewfinder */}
                            <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-black border border-zinc-700 shadow-inner">
                              <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                              />
                              {/* Viewfinder Target Grid Overlay */}
                              <div className="absolute inset-4 border border-white/40 border-dashed rounded-lg pointer-events-none flex items-center justify-center">
                                <span className="text-[10px] text-white/80 bg-black/60 px-2.5 py-0.5 rounded backdrop-blur-xs">
                                  Align product inside frame
                                </span>
                              </div>
                            </div>

                            {/* Camera Action Buttons */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={captureSnapshot}
                                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 active:scale-95 transition-all text-xs"
                              >
                                <Camera className="w-4 h-4 fill-current" />
                                <span>ছবি তুলুন (Snap & Add Photo)</span>
                              </button>

                              <button
                                type="button"
                                onClick={toggleCameraFacing}
                                className="p-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-xl transition-colors"
                                title="Switch Front/Rear Camera"
                              >
                                <SwitchCamera className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={stopCamera}
                                className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors text-xs font-semibold"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 bg-zinc-900/50 rounded-xl border border-zinc-800 space-y-3">
                            <div className="p-3 w-12 h-12 mx-auto rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                              <Camera className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-200 text-xs">Live Camera Snapshot</p>
                              <p className="text-[11px] text-zinc-400 mt-0.5">
                                Take photos directly using your webcam or phone and add to product gallery
                              </p>
                            </div>
                            <div className="flex items-center justify-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => startCamera()}
                                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 text-xs cursor-pointer transition-all"
                              >
                                <Camera className="w-4 h-4" />
                                <span>Start Camera (ক্যামেরা চালু করুন)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => mobileCameraInputRef.current?.click()}
                                className="py-2 px-3 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <Smartphone className="w-4 h-4" />
                                <span>Phone App</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Photo Gallery Manager (Displays all attached photos) */}
                    {(formImages.length > 0 || formImageUrl) && (
                      <div className="mt-2 pt-3 border-t border-zinc-700/70 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                            <Images className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Attached Gallery Photos ({formImages.length > 0 ? formImages.length : 1}):</span>
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            #1 is Cover Photo • Hover shows #2
                          </span>
                        </div>

                        {/* Thumbnail Grid */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {(formImages.length > 0 ? formImages : [formImageUrl]).map((imgUrl, idx) => (
                            <div
                              key={idx}
                              className={`relative group rounded-xl overflow-hidden border-2 bg-zinc-900 aspect-square ${
                                idx === 0
                                  ? "border-emerald-500 ring-2 ring-emerald-500/20"
                                  : "border-zinc-700 hover:border-zinc-500"
                              }`}
                            >
                              <img
                                src={imgUrl}
                                alt={`Product ${idx + 1}`}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />

                              {/* Cover Badge */}
                              {idx === 0 ? (
                                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold shadow-xs">
                                  Cover (১ম)
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetAsCover(idx)}
                                  className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded bg-zinc-900/90 hover:bg-emerald-600 text-white text-[9px] font-semibold transition-all shadow-xs cursor-pointer"
                                  title="Make this the Cover image"
                                >
                                  Make Cover
                                </button>
                              )}

                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-red-600 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                title="Remove photo"
                              >
                                <X className="w-3 h-3" />
                              </button>

                              {/* Index number badge */}
                              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] text-zinc-300 font-mono">
                                #{idx + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-zinc-300 mb-1">Badge Tag</label>
                      <input
                        type="text"
                        value={formBadge}
                        onChange={(e) => setFormBadge(e.target.value)}
                        placeholder="Bestseller / Hot"
                        className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id="featured-checkbox"
                        checked={formFeatured}
                        onChange={(e) => setFormFeatured(e.target.checked)}
                        className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 cursor-pointer"
                      />
                      <label htmlFor="featured-checkbox" className="font-semibold text-zinc-300 cursor-pointer">
                        Feature in Hero Banner
                      </label>
                    </div>
                  </div>

                  {/* 1. Website Visibility: Active / Inactive Switch */}
                  <div className="p-3.5 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            formIsActive ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
                          }`}
                        />
                        <span className="font-bold text-xs text-white">
                          {formIsActive
                            ? "Active Status (ওয়েবসাইটে প্রদর্শিত হবে)"
                            : "Inactive Status (ওয়েবসাইট থেকে লুকানো থাকবে)"}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        {formIsActive
                          ? "পণ্যটি পাবলিক ওয়েবসাইটে কাস্টমারদের জন্য সক্রিয় থাকবে।"
                          : "পণ্যটি ইনঅ্যাক্টিভ থাকবে, মূল ওয়েবসাইটে কাস্টমাররা এটি দেখতে পাবেন না।"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFormIsActive(!formIsActive)}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                        formIsActive ? "bg-emerald-500" : "bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formIsActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* 2. Offer Zone Deal Switch & Tag */}
                  <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-white flex items-center gap-1.5">
                            <span>অফার জোন (Offer Zone) এ দেখান</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              /offer-zone
                            </span>
                          </p>
                          <p className="text-[11px] text-amber-200/70">
                            পণ্যটি মূল ক্যাটাগরির পাশাপাশি অফার জোন পেজেও বিশেষ ডিলে প্রদর্শিত হবে
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFormIsOfferZone(!formIsOfferZone)}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                          formIsOfferZone ? "bg-amber-500" : "bg-zinc-700"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formIsOfferZone ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {formIsOfferZone && (
                      <div className="pt-2 border-t border-amber-500/20 space-y-1">
                        <label className="block text-[11px] font-semibold text-zinc-300">
                          অফার ডিসকাউন্ট নোট বা স্পেশাল ব্যাজ (ঐচ্ছিক)
                        </label>
                        <input
                          type="text"
                          value={formOfferDiscountNote}
                          onChange={(e) => setFormOfferDiscountNote(e.target.value)}
                          placeholder="যেমন: ২০% ছাড়, ধামাকা অফার, স্পেশাল ডিল"
                          className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* 2. Affiliate / External Product Direct Link Section */}
                  <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-white">
                            Affiliate / External Product (অ্যাফিলিয়েট প্রোডাক্ট)
                          </p>
                          <p className="text-[11px] text-indigo-200/70">
                            অন্য কোনো ওয়েবসাইটের প্রোডাক্ট লিংক বসিয়ে সরাসরি এফিলিয়েট হিসেবে বিক্রি করুন
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFormIsAffiliate(!formIsAffiliate)}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                          formIsAffiliate ? "bg-indigo-600" : "bg-zinc-700"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formIsAffiliate ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {formIsAffiliate && (
                      <div className="space-y-3 pt-3 border-t border-indigo-500/20">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                            Direct Product / Affiliate URL (অন্য ওয়েবসাইটের লিংক) *
                          </label>
                          <div className="relative">
                            <input
                              type="url"
                              required={formIsAffiliate}
                              value={formAffiliateUrl}
                              onChange={(e) => handleAffiliateUrlChange(e.target.value)}
                              placeholder="https://www.daraz.com.bd/products/..."
                              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-zinc-500"
                            />
                            <Link2 className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-1">
                            যেমন: দারাজ, অ্যামাজন বা যেকোনো অনলাইন স্টোরের প্রোডাক্ট লিংক। কাস্টমার ক্লিক করলে সরাসরি সেই সাইটে চলে যাবে।
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                              Platform / Source (উৎস)
                            </label>
                            <input
                              type="text"
                              value={formAffiliateSource}
                              onChange={(e) => setFormAffiliateSource(e.target.value)}
                              placeholder="e.g. Daraz, Amazon, Bikroy"
                              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                              Button Text (বাটনের নাম)
                            </label>
                            <input
                              type="text"
                              value={formAffiliateButtonText}
                              onChange={(e) => setFormAffiliateButtonText(e.target.value)}
                              placeholder="e.g. দারাজে সরাসরি অর্ডার করুন"
                              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-300 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Detailed product specifications..."
                      className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:ring-1 focus:ring-emerald-500 resize-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        setIsProductFormOpen(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingProduct}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingProduct ? "Saving..." : "Save Product"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Instant Delete Confirmation Modal (In-App, 100% reliable inside iframes) */}
          {productToDelete && (
            <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
              <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Delete Product?</h4>
                    <p className="text-[11px] text-zinc-400">পণ্যটি অবিলম্বে ডিলিট করবেন?</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700 text-xs text-zinc-300">
                  <p className="text-zinc-400 text-[11px]">Selected Item:</p>
                  <p className="font-bold text-white text-sm mt-0.5 truncate">{productToDelete.title}</p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {productToDelete.id}</p>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  পণ্যটি আপনার স্টোর ক্যাটালগ থেকে তৎক্ষণাৎ মুছে ফেলা হবে।
                </p>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setProductToDelete(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancel (বাতিল)
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteProduct}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 cursor-pointer transition-all active:scale-95"
                  >
                    Instant Delete (মুছে ফেলুন)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Order Confirmation Modal (Deletes from Admin Panel only, retains Google Sheets) */}
          {orderToDelete && (
            <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
              <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">অর্ডারটি ডিলিট করবেন?</h4>
                    <p className="text-[11px] text-zinc-400">Delete Order #{orderToDelete.id}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700 text-xs text-zinc-300">
                  <p className="text-zinc-400 text-[11px]">গ্রাহক:</p>
                  <p className="font-bold text-white text-sm mt-0.5">{orderToDelete.customerName}</p>
                  <p className="text-[11px] text-emerald-400 font-bold mt-1">অর্ডার মূল্য: ${orderToDelete.total.toFixed(2)}</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs leading-relaxed">
                  ✓ <strong>গুগল শিট সুরক্ষিত থাকবে:</strong> এই অর্ডারটি আপনার অ্যাডমিন প্যানেল থেকে মুছে যাবে, কিন্তু গুগল শিটের সমস্ত রেকর্ড অপরিবর্তিত ও সুরক্ষিত থাকবে।
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOrderToDelete(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancel (বাতিল)
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteOrder}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 cursor-pointer transition-all active:scale-95"
                  >
                    Delete Order
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Customer Confirmation Modal (Deletes from Admin Panel only, retains Google Sheets) */}
          {customerToDelete && (
            <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
              <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">কাস্টমার ডেটা ডিলিট করবেন?</h4>
                    <p className="text-[11px] text-zinc-400">Delete Customer: {customerToDelete.name}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700 text-xs text-zinc-300">
                  <p className="text-zinc-400 text-[11px]">ইমেইল:</p>
                  <p className="font-bold text-white text-sm mt-0.5">{customerToDelete.email}</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs leading-relaxed">
                  ✓ <strong>গুগল শিট সুরক্ষিত থাকবে:</strong> এই কাস্টমার প্রোফাইলটি অ্যাডমিন প্যানেল থেকে মুছে যাবে, কিন্তু গুগল শিটের সমস্ত রেকর্ড অক্ষত থাকবে।
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCustomerToDelete(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancel (বাতিল)
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteCustomer}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 cursor-pointer transition-all active:scale-95"
                  >
                    Delete Customer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Subscriber Confirmation Modal */}
          {subscriberToDelete && (
            <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
              <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">সাবস্ক্রাইবার ডিলিট করবেন?</h4>
                    <p className="text-[11px] text-zinc-400">Delete Subscriber</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700 text-xs text-zinc-300">
                  <p className="text-zinc-400 text-[11px]">ইমেইল:</p>
                  <p className="font-bold text-white text-sm mt-0.5 break-all">{subscriberToDelete}</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs leading-relaxed">
                  ✓ <strong>গুগল শিট সুরক্ষিত থাকবে:</strong> এই ইমেইলটি অ্যাডমিন প্যানেল থেকে মুছে যাবে, কিন্তু গুগল শিটের সমস্ত রেকর্ড অক্ষত থাকবে।
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSubscriberToDelete(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancel (বাতিল)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubscriber(subscriberToDelete)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 cursor-pointer transition-all active:scale-95"
                  >
                    Delete Subscriber
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Clear Saved Data Confirmation Modal */}
          {showClearConfirmModal && (
            <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
              <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-white">অ্যাডমিন প্যানেল থেকে সেভ করা ডেটা মুছবেন?</h4>
                    <p className="text-[11px] text-zinc-400">Clear Saved Admin Data (Local Store Reset)</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  অ্যাডমিন প্যানেলে সংরক্ষিত থাকা <strong>অর্ডার, কাস্টমার, সাবস্ক্রাইবার ও ইউজার ট্র্যাকিং</strong> ডেটা সম্পূর্ণ মুছে দেওয়া হবে।
                </p>

                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs leading-relaxed space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>গুগল শিটের ডেটা ১০০% অক্ষত ও নিরাপদ থাকবে</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80">
                    আপনার গুগল স্প্রেডশিটে থাকা কোনো ডেটা ডিলিট হবে না। আপনি চাইলে যেকোনো সময় আবার <strong>"শিট থেকে সিঙ্ক"</strong> বাটনে চাপ দিয়ে গুগল শিটের ডেটা দেখতে পারবেন।
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirmModal(false)}
                    disabled={isClearingSavedData}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    বাতিল (Cancel)
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSavedData}
                    disabled={isClearingSavedData}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 cursor-pointer transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Trash2 className={`w-3.5 h-3.5 ${isClearingSavedData ? "animate-spin" : ""}`} />
                    <span>{isClearingSavedData ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, ডেটা মুছুন"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Custom Total Revenue Editor Modal */}
          {isEditingRevenue && (
            <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
              <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-white">মোট রেভিনিউ পরিবর্তন</h4>
                      <p className="text-[11px] text-zinc-400">Custom Total Revenue Setting</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingRevenue(false)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      মোট রেভিনিউ পরিমাণ (টাকা / ৳ BDT) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-zinc-400 font-bold">৳</span>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={customRevenueInput}
                        onChange={(e) => setCustomRevenueInput(e.target.value)}
                        placeholder="e.g. 50000"
                        className="w-full pl-8 pr-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white font-bold text-base focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1.5">
                      💡 আপনি এখানে যেকোনো সংখ্যা লিখে সেভ করতে পারেন। ড্যাশবোর্ডে ও স্ট্যাটে এই মান প্রদর্শিত হবে।
                    </p>
                  </div>

                  {stats && (
                    <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/80 text-xs text-zinc-300 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">বর্তমান স্ট্যাটাস:</span>
                        <span className="font-semibold text-white">
                          {stats.isCustomRevenue ? "✏️ কাস্টম সেট করা" : "স্বয়ংক্রিয় (অর্ডার অনুযায়ী)"}
                        </span>
                      </div>
                      {stats.calculatedRevenue !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-zinc-400">অর্ডার থেকে স্বাভাবিক হিসাব:</span>
                          <span className="font-mono text-zinc-300">৳{stats.calculatedRevenue.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 flex-wrap border-t border-zinc-800">
                  {stats?.isCustomRevenue ? (
                    <button
                      type="button"
                      onClick={handleResetRevenue}
                      disabled={isSavingRevenue}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      স্বয়ংক্রিয় গণনায় রিসেট
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingRevenue(false)}
                      className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveRevenue}
                      disabled={isSavingRevenue}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSavingRevenue ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
