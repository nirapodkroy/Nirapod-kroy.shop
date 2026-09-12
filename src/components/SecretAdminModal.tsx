import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Product, Order, AdminStats } from "../types";
import {
  X,
  Lock,
  KeyRound,
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileSpreadsheet,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  CheckCircle2,
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
  Sparkles,
  Images
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
  const [adminEmail, setAdminEmail] = useState("mtarifprodhan@gmail.com");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin View Tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "orders" | "sheets">("dashboard");

  // Admin Data State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Admin Products State (Includes inactive products)
  const [adminProducts, setAdminProducts] = useState<Product[]>(products);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState<"all" | "active" | "inactive" | "affiliate">("all");
  const [productToDelete, setProductToDelete] = useState<{ id: string; title: string } | null>(null);

  // Product Form Modal State (Add / Edit)
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formRegularPrice, setFormRegularPrice] = useState("");
  const [formCategory, setFormCategory] = useState("Groceries");
  const [formStock, setFormStock] = useState("25");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formImages, setFormImages] = useState<string[]>([]);
  const [linkInputUrl, setLinkInputUrl] = useState("");
  const [formBadge, setFormBadge] = useState("");
  const [formFeatured, setFormFeatured] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
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
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const snapshotUrl = canvas.toDataURL("image/jpeg", 0.86);
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

  // Helper to compress a single image file
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
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
              resolve(canvas.toDataURL("image/jpeg", 0.86));
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

    try {
      // 1. Stats
      const statsRes = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      // 2. Orders
      setIsLoadingOrders(true);
      const ordersRes = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
      }

      // 3. Settings
      const settingsRes = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        setWebhookUrl(sData.webhookUrl || "");
      }

      // 4. Products (All products including inactive)
      const prodsRes = await fetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (prodsRes.ok) {
        const pData = await prodsRes.json();
        if (Array.isArray(pData.products)) {
          setAdminProducts(pData.products);
        }
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setIsLoadingOrders(false);
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

  if (!isAdminModalOpen) return null;

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const success = await loginAdmin(adminPassword, adminEmail);
    setIsLoggingIn(false);
    if (success) {
      setAdminPassword("");
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
    setFormCategory("Groceries");
    setFormStock("20");
    setFormImageUrl("");
    setFormImages([]);
    setLinkInputUrl("");
    setImageFileName("");
    setImageInputMode("device");
    setFormBadge("New");
    setFormFeatured(false);
    setFormIsActive(true);
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
    setFormCategory(prod.category);
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

      const payload: Partial<Product> = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        price: Number(formPrice),
        regularPrice: formRegularPrice ? Number(formRegularPrice) : undefined,
        category: formCategory.trim(),
        stock: formIsAffiliate ? 999 : Number(formStock) || 0,
        imageUrl: primaryImg,
        images: payloadImages,
        badge: formBadge.trim() || undefined,
        featured: formFeatured,
        isActive: formIsActive,
        isAffiliate: formIsAffiliate,
        affiliateUrl: formIsAffiliate ? formAffiliateUrl.trim() : undefined,
        affiliateSource: formIsAffiliate ? (formAffiliateSource.trim() || "Online Partner") : undefined,
        affiliateButtonText: formIsAffiliate ? (formAffiliateButtonText.trim() || undefined) : undefined,
      };

      const endpoint = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(endpoint, {
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

        // Optimistically update admin product list
        if (editingProduct) {
          setAdminProducts((prev) =>
            prev.map((p) => (p.id === editingProduct.id ? savedProd : p))
          );
        } else {
          setAdminProducts((prev) => [savedProd, ...prev]);
        }

        addToast(
          editingProduct ? "Product updated successfully!" : "New product created successfully!",
          "success"
        );
        setIsProductFormOpen(false);
        onProductsUpdated();
        fetchAdminData();
      } else {
        const errData = await res.json();
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

  // Confirmed Delete execution (Instant removal)
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const { id, title } = productToDelete;
    setProductToDelete(null);

    // 1. Instant optimistic UI removal
    setAdminProducts((prev) => prev.filter((p) => p.id !== id));
    addToast(`"${title}" deleted instantly!`, "info");

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (res.ok) {
        onProductsUpdated();
        fetchAdminData();
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast(errData.error || "Failed to delete product on server", "error");
        fetchAdminData();
        onProductsUpdated();
      }
    } catch (err) {
      console.error(err);
      addToast("Error deleting product", "error");
      fetchAdminData();
      onProductsUpdated();
    }
  };

  // Toggle Active/Inactive status instantly
  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    const nextState = !currentlyActive;

    // 1. Instant optimistic update in admin list
    setAdminProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: nextState } : p))
    );

    addToast(
      nextState
        ? "Product Activated (ওয়েবসাইটে এখন লাইভ)"
        : "Product Inactivated (ওয়েবসাইট থেকে লুকানো হয়েছে)",
      "success"
    );

    try {
      const res = await fetch(`/api/products/${id}/toggle-active`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (res.ok) {
        onProductsUpdated();
      } else {
        addToast("Failed to update status on server", "error");
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      addToast("Network error updating status", "error");
      fetchAdminData();
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

  // Save Webhook URL
  const handleSaveWebhook = async () => {
    setIsSavingWebhook(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ webhookUrl })
      });

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

  // Test Webhook
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
        addToast(data.message || "Webhook test passed! Check your Google Sheet.", "success");
      } else {
        addToast(data.error || "Webhook test failed.", "error");
      }
    } catch {
      addToast("Webhook test failed.", "error");
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const sampleAppsScriptCode = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Auto-create headers if sheet is blank
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Order ID", "Date/Time", "Customer Name", "Customer Email", 
        "Customer Phone", "Shipping Address", "Ordered Items", 
        "Total Price", "Payment Method", "Status"
      ]);
      sheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#e6f4ea");
    }
    
    if (data.sheetRow) {
      sheet.appendRow(data.sheetRow);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsAdminModalOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl rounded-3xl bg-zinc-900 border border-zinc-700/80 text-zinc-100 shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[92dvh]"
        >
          {/* Top Admin Header Bar */}
          <div className="px-4 sm:px-6 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-3">
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
                    HIDDEN ROOT
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate">
                  Shortcut: <code className="text-zinc-300 font-bold">Ctrl/Cmd + Alt + Shift + T</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAdminLoggedIn && (
                <button
                  onClick={logoutAdmin}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-rose-400 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit Console</span>
                </button>
              )}
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                aria-label="Close admin modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {!isAdminLoggedIn ? (
            /* 1. SECRET ADMIN LOGIN FORM */
            <div className="p-8 sm:p-12 max-w-md mx-auto w-full text-center">
              <div className="w-16 h-16 rounded-3xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto text-amber-400 mb-4 shadow-inner">
                <KeyRound className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white font-display">
                Authorized Credentials Required
              </h3>
              <p className="text-xs text-zinc-400 mt-1 mb-6">
                Enter backend root admin credentials to access inventory and private Google Sheets integration.
              </p>

              <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">Default: mtarifprodhan@gmail.com</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Secure Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                  >
                    {isLoggingIn ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    ) : (
                      "Unlock Admin Console"
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-4 border-t border-zinc-800 text-[11px] text-zinc-500">
                <span>Credentials strictly verified server-side. Public UI button remains 100% hidden.</span>
              </div>
            </div>
          ) : (
            /* 2. AUTHENTICATED ADMIN DASHBOARD */
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Tab Navigation */}
              <div className="px-4 sm:px-6 py-2.5 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
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
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
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
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === "orders"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Orders ({orders.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("sheets")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === "sheets"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Google Sheets Sync</span>
                  </button>
                </div>

                <button
                  onClick={fetchAdminData}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Refresh Dashboard Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* TAB 1: DASHBOARD OVERVIEW */}
                {activeTab === "dashboard" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-zinc-400">Total Revenue</span>
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="mt-2 text-2xl font-extrabold text-white font-display">
                          ${stats?.totalRevenue ? stats.totalRevenue.toFixed(2) : "0.00"}
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-1">Confirmed store sales</p>
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

                    <div className="rounded-2xl border border-zinc-700 overflow-hidden bg-zinc-800/40">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-950 text-zinc-400 uppercase font-semibold text-[11px] border-b border-zinc-700">
                            <tr>
                              <th className="p-3.5">Product</th>
                              <th className="p-3.5">Category</th>
                              <th className="p-3.5">Price</th>
                              <th className="p-3.5 text-center">Website Status</th>
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
                                  (prod.affiliateSource && prod.affiliateSource.toLowerCase().includes(term));

                                if (!matchesSearch) return false;
                                if (productStatusFilter === "active") return prod.isActive !== false;
                                if (productStatusFilter === "inactive") return prod.isActive === false;
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
                                        <div className="flex items-center gap-1.5">
                                          <p className="font-semibold text-white truncate">{prod.title}</p>
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
                                    <td className="p-3.5 text-zinc-300">{prod.category}</td>
                                    <td className="p-3.5 font-bold text-white">৳{prod.price.toLocaleString()}</td>
                                    
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
                                        title={isActive ? "Click to hide from store" : "Click to publish on store"}
                                      >
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full ${
                                            isActive ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
                                          }`}
                                        />
                                        <span>{isActive ? "Active (লাইভ)" : "Inactive (লুকানো)"}</span>
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
                                <p className="font-bold text-sm text-emerald-400 font-display">
                                  ${order.totalPrice.toFixed(2)}
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
                          </div>
                        ))}
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
                        Google Sheets Webhook Configuration
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        When customer orders are confirmed, the backend immediately sends the complete order row to this Google Apps Script Webhook.
                      </p>
                    </div>

                    {/* Webhook Input Box */}
                    <div className="p-5 rounded-2xl bg-zinc-800/60 border border-zinc-700 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Google Apps Script Webhook URL
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="https://script.google.com/macros/s/.../exec"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            onClick={handleSaveWebhook}
                            disabled={isSavingWebhook}
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                          >
                            {isSavingWebhook ? "Saving..." : "Save URL"}
                          </button>
                          <button
                            onClick={handleTestWebhook}
                            disabled={isTestingWebhook}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-xs transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{isTestingWebhook ? "Testing..." : "Test Webhook"}</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1.5">
                          You can also save this into your <code>.env</code> file under <code>GOOGLE_SHEET_WEBHOOK_URL</code>.
                        </p>
                      </div>
                    </div>

                    {/* 30-Second Setup Guide with Copyable Script */}
                    <div className="p-5 rounded-2xl bg-zinc-800/40 border border-zinc-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-white">
                          Ready-to-Deploy Google Apps Script Code (30-Second Setup)
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
                        <li>Create a new Google Sheet at <strong>sheets.google.com</strong>.</li>
                        <li>Click <strong>Extensions &gt; Apps Script</strong>.</li>
                        <li>Paste the code snippet below into <code>Code.gs</code>.</li>
                        <li>Click <strong>Deploy &gt; New deployment</strong>, select type <strong>Web app</strong>.</li>
                        <li>Set <em>Execute as</em>: <strong>Me</strong>, and <em>Who has access</em>: <strong>Anyone</strong>.</li>
                        <li>Copy the generated Web App URL and paste it into the field above!</li>
                      </ol>

                      <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-48">
                        {sampleAppsScriptCode}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-Modal: Add / Edit Product */}
          {isProductFormOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
              <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4">
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-zinc-300 mb-1">Category *</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Groceries">Groceries (মুদি ও খাদ্য)</option>
                        <option value="Electronics">Electronics (ইলেকট্রনিক্স)</option>
                        <option value="Fashion">Fashion (পোশাক ও ফ্যাশন)</option>
                        <option value="Health & Beauty">Health & Beauty (রূপচর্চা ও স্বাস্থ্য)</option>
                        <option value="Home & Kitchen">Home & Kitchen (গৃহস্থালি)</option>
                        <option value="Baby & Kids">Baby & Kids (শিশু ও খেলনা)</option>
                        <option value="Sports">Sports (খেলাধুলা ও ফিটনেস)</option>
                        <option value="Books">Books (বই ও স্টেশনারি)</option>
                        <option value="Accessories">Accessories (অন্যান্য)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-300 mb-1">Inventory Stock *</label>
                      <input
                        type="number"
                        required
                        value={formStock}
                        onChange={(e) => setFormStock(e.target.value)}
                        className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-zinc-300 mb-1">Sale Price ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder="149.00"
                        className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-300 mb-1">Regular Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formRegularPrice}
                        onChange={(e) => setFormRegularPrice(e.target.value)}
                        placeholder="199.00"
                        className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:ring-1 focus:ring-emerald-500"
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
