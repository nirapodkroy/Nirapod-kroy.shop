import { TrackingStep, Order } from "../types";

export interface TrackingStepDefinition {
  id: 'confirmed' | 'processing' | 'dispatched' | 'out_for_delivery' | 'delivered';
  stepNumber: number;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  defaultStatus: 'Pending' | 'Processing' | 'Shipped' | 'Delivered';
  defaultNote: string;
  presetSuggestions: string[];
}

export const ORDER_TRACKING_STEPS_DEF: TrackingStepDefinition[] = [
  {
    id: 'confirmed',
    stepNumber: 1,
    titleBn: 'অর্ডার কনফার্মেশন',
    titleEn: 'Order Confirmed',
    descBn: 'অর্ডার গৃহীত ও ভেরিফাই সম্পন্ন',
    descEn: 'Order verified & confirmed',
    defaultStatus: 'Pending',
    defaultNote: 'অর্ডার কনফার্মেশন সম্পন্ন হয়েছে। শীঘ্রই প্যাকেজিং শুরু হবে।',
    presetSuggestions: [
      'অর্ডার কনফার্মেশন সম্পন্ন হয়েছে। শীঘ্রই প্যাকেজিং শুরু হবে।',
      'গ্রাহকের সাথে ফোনে যোগাযোগ করে অর্ডার কনফার্ম করা হয়েছে।',
      'অর্ডার রিসিভ করা হয়েছে এবং ডেলিভারি প্রস্তুত করা হচ্ছে।'
    ]
  },
  {
    id: 'processing',
    stepNumber: 2,
    titleBn: 'প্যাকেজিং ও প্রসেসিং',
    titleEn: 'Packaging & Processing',
    descBn: 'মান যাচাই ও প্যাকেজিং চলছে',
    descEn: 'Quality check & packaging',
    defaultStatus: 'Processing',
    defaultNote: 'পণ্যের মান যাচাই সম্পন্ন হয়েছে এবং পার্সেল প্যাকেজিং চলছে।',
    presetSuggestions: [
      'পণ্যের মান যাচাই সম্পন্ন হয়েছে এবং পার্সেল প্যাকেজিং চলছে।',
      'ইনভেন্টরি থেকে পণ্য সংগ্রহ করে সিকিউর প্যাকেজিং সম্পন্ন হয়েছে।',
      'প্যাকেজিং শেষ হয়েছে, আজই কুরিয়ার হাবে পাঠানো হবে।'
    ]
  },
  {
    id: 'dispatched',
    stepNumber: 3,
    titleBn: 'কুরিয়ারে পাঠানো হয়েছে',
    titleEn: 'Dispatched to Courier',
    descBn: 'কুরিয়ার হাবে হস্তান্তর হয়েছে',
    descEn: 'Handed over to courier hub',
    defaultStatus: 'Shipped',
    defaultNote: 'পার্সেল কুরিয়ার হাবে হস্তান্তর করা হয়েছে এবং ট্র্যাকিং আইডি বরাদ্দ হয়েছে।',
    presetSuggestions: [
      'পার্সেল কুরিয়ার হাবে হস্তান্তর করা হয়েছে এবং ট্র্যাকিং আইডি বরাদ্দ হয়েছে।',
      'Steadfast কুরিয়ার সার্ভিসে বুকিং সম্পন্ন হয়েছে। ট্র্যাকিং শুরু হয়েছে।',
      'RedX কুরিয়ারে বুকিং সম্পন্ন হয়েছে। আপনার জেলায় পাঠানো হচ্ছে।',
      'সুন্দরবন কুরিয়ার সার্ভিসে পার্সেল বুকিং দেওয়া হয়েছে।'
    ]
  },
  {
    id: 'out_for_delivery',
    stepNumber: 4,
    titleBn: 'ডেলিভারির পথে',
    titleEn: 'Out for Delivery',
    descBn: 'ডেলিভারিম্যান আপনার ঠিকানায় রওনা হয়েছে',
    descEn: 'Rider is heading to your address',
    defaultStatus: 'Shipped',
    defaultNote: 'ডেলিভারি রাইডার আপনার ঠিকানায় পার্সেল নিয়ে রওনা হয়েছে। ফোন সচল রাখুন।',
    presetSuggestions: [
      'ডেলিভারি রাইডার আপনার ঠিকানায় পার্সেল নিয়ে রওনা হয়েছে। ফোন সচল রাখুন।',
      'আজকের মধ্যে ডেলিভারিম্যান আপনার সাথে ফোনে যোগাযোগ করে পার্সেল হস্তান্তর করবে।',
      'পার্সেলটি আপনার স্থানীয় কুরিয়ার হাব থেকে ডেলিভারির জন্য বের হয়েছে।'
    ]
  },
  {
    id: 'delivered',
    stepNumber: 5,
    titleBn: 'ডেলিভারি সম্পন্ন',
    titleEn: 'Delivered',
    descBn: 'পণ্য গ্রাহকের নিকট সফলভাবে হস্তান্তরিত',
    descEn: 'Successfully delivered to customer',
    defaultStatus: 'Delivered',
    defaultNote: 'পণ্যটি গ্রাহকের নিকট সফলভাবে হস্তান্তর ও ডেলিভারি সম্পন্ন হয়েছে।',
    presetSuggestions: [
      'পণ্যটি গ্রাহকের নিকট সফলভাবে হস্তান্তর ও ডেলিভারি সম্পন্ন হয়েছে।',
      'ক্যাশ অন ডেলিভারি পেমেন্ট গৃহীত এবং অর্ডার সফলভাবে সম্পন্ন হয়েছে।',
      'নিরাপদ ক্রয়ের সাথে থাকার জন্য আপনাকে ধন্যবাদ! পণ্য সম্পর্কে মতামত দিন।'
    ]
  }
];

export function getStepIndexFromOrder(order?: Partial<Order> | null): number {
  if (!order) return 0;
  if (typeof order.currentStepIndex === 'number' && order.currentStepIndex >= 0 && order.currentStepIndex <= 4) {
    return order.currentStepIndex;
  }

  const stage = String(order.trackingStage || '').toLowerCase();
  if (stage === 'delivered') return 4;
  if (stage === 'out_for_delivery' || stage === 'out') return 3;
  if (stage === 'dispatched' || stage === 'shipped') return 2;
  if (stage === 'processing' || stage === 'packed') return 1;
  if (stage === 'confirmed') return 0;

  const status = String(order.status || '').toLowerCase();
  const details = String(order.orderTrackingDetails || order.trackingDetails || '').toLowerCase();

  const combined = `${status} ${details}`;
  if (combined.includes('deliver') || combined.includes('সম্পন্ন') || combined.includes('হস্তান্তরিত')) return 4;
  if (combined.includes('out') || combined.includes('পথে') || combined.includes('transit') || combined.includes('রওনা')) return 3;
  if (combined.includes('ship') || combined.includes('dispatch') || combined.includes('কুরিয়ার') || combined.includes('কুরিয়ারে') || combined.includes('courier')) return 2;
  if (combined.includes('process') || combined.includes('প্যাকেজিং') || combined.includes('প্রসেসিং')) return 1;

  return 0;
}

export function buildTrackingSteps(
  currentStepIndex: number,
  existingSteps?: TrackingStep[],
  baseDate?: string,
  currentDetails?: string
): TrackingStep[] {
  const safeIdx = Math.max(0, Math.min(4, currentStepIndex));
  const nowIso = new Date().toISOString();
  const createdDate = baseDate || nowIso;

  return ORDER_TRACKING_STEPS_DEF.map((def, idx) => {
    const existing = existingSteps?.find((s) => s.stepNumber === def.stepNumber || s.id === def.id);
    const isCompleted = idx <= safeIdx;

    let completedAt: string | undefined = existing?.completedAt;
    if (isCompleted && !completedAt) {
      if (idx === 0) {
        completedAt = createdDate;
      } else if (idx === safeIdx) {
        completedAt = nowIso;
      } else {
        completedAt = existing?.completedAt || createdDate;
      }
    } else if (!isCompleted) {
      completedAt = undefined;
    }

    let note = existing?.note;
    if (idx === safeIdx && currentDetails) {
      note = currentDetails;
    } else if (!note) {
      note = def.defaultNote;
    }

    return {
      id: def.id,
      stepNumber: def.stepNumber,
      titleBn: def.titleBn,
      titleEn: def.titleEn,
      descBn: def.descBn,
      descEn: def.descEn,
      completed: isCompleted,
      completedAt,
      note
    };
  });
}

export function formatTrackingDate(dateStr?: string, language: 'bn' | 'en' = 'bn'): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    return d.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateStr;
  }
}

export function generateDefaultTrackingNumber(orderId: string): string {
  const digits = orderId.replace(/\D/g, '');
  return `TRK-${digits || Math.floor(100000 + Math.random() * 900000)}`;
}
