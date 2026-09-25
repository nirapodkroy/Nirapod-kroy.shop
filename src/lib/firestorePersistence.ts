import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { CustomerUser, Order } from "../types";

export interface FirestoreUserProfile {
  userId: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Saves or updates user profile in Firestore
 */
export async function syncUserProfileToFirestore(user: CustomerUser, photoURL?: string): Promise<void> {
  if (!user.id) return;
  const path = `users/${user.id}`;
  try {
    const dataToSave: FirestoreUserProfile = {
      userId: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || "",
      address: user.address || "",
      photoURL: photoURL || user.photoURL || "",
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, "users", user.id), dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Loads user profile from Firestore
 */
export async function fetchUserProfileFromFirestore(userId: string): Promise<FirestoreUserProfile | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (snap.exists()) {
      return snap.data() as FirestoreUserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Persists user's wishlist in Firestore
 */
export async function saveUserWishlistToFirestore(userId: string, productIds: string[]): Promise<void> {
  if (!userId) return;
  const path = `users/${userId}/wishlist/default`;
  try {
    await setDoc(doc(db, "users", userId, "wishlist", "default"), {
      userId,
      productIds: productIds.slice(0, 150),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches user's wishlist from Firestore
 */
export async function fetchUserWishlistFromFirestore(userId: string): Promise<string[]> {
  if (!userId) return [];
  const path = `users/${userId}/wishlist/default`;
  try {
    const snap = await getDoc(doc(db, "users", userId, "wishlist", "default"));
    if (snap.exists()) {
      const data = snap.data();
      return Array.isArray(data.productIds) ? data.productIds : [];
    }
    return [];
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Saves placed order to customer's Firestore orders collection
 */
export async function saveUserOrderToFirestore(userId: string, order: Order): Promise<void> {
  if (!userId || !order.id) return;
  const cleanId = order.id.replace(/[^a-zA-Z0-9_-]/g, "");
  const path = `users/${userId}/orders/${cleanId}`;
  try {
    const orderDoc = {
      id: cleanId,
      userId,
      customerName: order.customerName || "Customer",
      customerEmail: order.customerEmail || "",
      customerPhone: order.customerPhone || "",
      shippingAddress: order.shippingAddress || "",
      totalPrice: Number(order.totalPrice) || 0,
      paymentMethod: order.paymentMethod || "Cash on Delivery",
      status: order.status || "Pending",
      createdAt: order.createdAt || new Date().toISOString(),
      trackingNumber: order.trackingNumber || ""
    };
    await setDoc(doc(db, "users", userId, "orders", cleanId), orderDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribes to customer's Firestore orders in real-time
 */
export function subscribeToUserOrders(
  userId: string,
  onOrders: (orders: any[]) => void
): () => void {
  if (!userId) return () => {};
  const path = `users/${userId}/orders`;
  try {
    const q = query(collection(db, "users", userId, "orders"), orderBy("createdAt", "desc"), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data());
        onOrders(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
