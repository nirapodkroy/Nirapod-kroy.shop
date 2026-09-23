import { Order } from "../types";

/**
 * Robust order matching helper for Nirapod Kroy order tracking.
 * Matches by:
 * 1. Clean alphanumeric order ID or tracking ID (e.g., "TRK-765550", "#TRK-765550", "trk 765550")
 * 2. Digits only in ID/Tracking (e.g. "765550")
 * 3. Bangladeshi Phone number variants (e.g. "01711223344", "+8801711223344", "01711-223344", last 8-10 digits)
 * 4. Customer Name (e.g. "Muhammad Tarif")
 * 5. Customer Email
 */
export function matchOrder(o: Partial<Order> | any, rawQuery: string): boolean {
  if (!o || !rawQuery) return false;
  const qLower = rawQuery.toLowerCase().trim();
  if (!qLower) return false;

  const qClean = qLower.replace(/[^a-z0-9]/g, "");
  const qDigits = rawQuery.replace(/\D/g, "");

  const oId = String(o.id || "").toLowerCase();
  const oCleanId = oId.replace(/[^a-z0-9]/g, "");
  const oTrk = String(o.trackingNumber || "").toLowerCase();
  const oCleanTrk = oTrk.replace(/[^a-z0-9]/g, "");
  const oPhone = String(o.customerPhone || "").replace(/\D/g, "");
  const oName = String(o.customerName || "").toLowerCase();
  const oEmail = String(o.customerEmail || "").toLowerCase();

  // 1. Direct or clean alphanumeric match on ID or Tracking Number
  if (oId === qLower || oTrk === qLower) return true;
  if (qClean.length >= 3 && (oCleanId === qClean || oCleanTrk === qClean)) return true;
  if (qClean.length >= 4 && (oCleanId.includes(qClean) || oCleanTrk.includes(qClean) || qClean.includes(oCleanId) || qClean.includes(oCleanTrk))) return true;

  // 2. Digits match on ID or Tracking Number (e.g., user enters "765550")
  if (qDigits.length >= 4) {
    const oIdDigits = oId.replace(/\D/g, "");
    const oTrkDigits = oTrk.replace(/\D/g, "");
    if (oIdDigits === qDigits || oTrkDigits === qDigits) return true;
    if (oIdDigits.includes(qDigits) || oTrkDigits.includes(qDigits) || (qDigits.length >= 5 && (qDigits.includes(oIdDigits) || qDigits.includes(oTrkDigits)))) return true;
  }

  // 3. Bangladeshi Phone Number match (01XXXXXXXXX vs 8801XXXXXXXXX vs +880...)
  if (qDigits.length >= 7 && oPhone.length >= 7) {
    if (oPhone === qDigits) return true;
    if (oPhone.includes(qDigits) || qDigits.includes(oPhone)) return true;
    const qTail = qDigits.slice(-10);
    const oTail = oPhone.slice(-10);
    if (qTail.length >= 8 && oTail.length >= 8) {
      if (qTail === oTail || qTail.endsWith(oTail) || oTail.endsWith(qTail)) return true;
    }
  }

  // 4. Customer Name match
  if (qLower.length >= 3 && (oName === qLower || oName.includes(qLower) || (qLower.length >= 4 && qLower.includes(oName)))) return true;

  // 5. Customer Email match
  if (qLower.includes("@") && oEmail.includes(qLower)) return true;

  return false;
}
