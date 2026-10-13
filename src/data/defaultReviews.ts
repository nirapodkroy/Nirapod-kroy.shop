export interface Review {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  rating: number;
  productName: string;
  category: "all" | "food" | "dates" | "oil_ghee" | "fashion" | "gadgets";
  comment: string;
  date: string;
  isActive: boolean;
  isVerified: boolean;
  likes: number;
}

export const DEFAULT_REVIEWS: Review[] = [
  {
    "id": "rev-1",
    "name": "তানভীর হাসান",
    "email": "tanvir.h@gmail.com",
    "phone": "01711223344",
    "location": "মিরপুর-১০, ঢাকা",
    "rating": 5,
    "productName": "সুন্দরবনের প্রাকৃতিক খলিশা মধু - ১ কেজি",
    "category": "food",
    "comment": "মধুর স্বাদ ও ঘ্রাণ এক কথায় অসাধারণ! আগে অনেক জায়গা থেকে মধু নিয়েছি কিন্তু এইরকম খাঁটি ও র’ মধু খুব কম পাওয়া যায়। প্যাকেজিং ও কাঁচের জার খুব নিরাপদে ডেলিভারি পেয়েছি।",
    "date": "2026-10-11T07:31:34.379Z",
    "isActive": true,
    "isVerified": true,
    "likes": 42
  },
  {
    "id": "rev-2",
    "name": "মাহমুদা আক্তার মিলি",
    "email": "mili.akhtar@yahoo.com",
    "phone": "01819334455",
    "location": "পাঁচলাইশ, চট্টগ্রাম",
    "rating": 5,
    "productName": "প্রিমিয়াম মরিয়ম খেজুর (সরাসরি মদিনা) - ১ কেজি",
    "category": "dates",
    "comment": "রমজানের আগেই খেজুরের অর্ডার করেছিলাম। চট্টগ্রামের ঠিকানায় মাত্র ২ দিনে ডেলিভারি পেয়েছি। খেজুরগুলো একেবারে নরম, ফ্রেশ ও বড় সাইজের। নিরাপদ ক্রয়ের সার্ভিস সত্যিই প্রশংসনীয়।",
    "date": "2026-10-09T07:31:34.380Z",
    "isActive": true,
    "isVerified": true,
    "likes": 29
  },
  {
    "id": "rev-3",
    "name": "রাশেদুল ইসলাম",
    "email": "rashed.sylhet@gmail.com",
    "phone": "01712998877",
    "location": "উপশহর, সিলেট",
    "rating": 5,
    "productName": "ঘানি ভাঙা কাঠের খাঁটি সরিষার তেল - ২ লিটার",
    "category": "oil_ghee",
    "comment": "তেলের ঝাঁজ আর আসল সরিষার সুবাসেই বোঝা যায় কোনো কেমিক্যাল নেই। রান্নায় চমৎকার স্বাদ এনে দেয়। ডেলিভারি বয় খুব ভদ্র ছিলেন এবং পার্সেল চেক করে টাকা দিয়েছি।",
    "date": "2026-10-07T07:31:34.380Z",
    "isActive": true,
    "isVerified": true,
    "likes": 38
  },
  {
    "id": "rev-4",
    "name": "ফারহানা হক",
    "email": "farhana.haque@gmail.com",
    "phone": "01911445566",
    "location": "উত্তরা সেক্টর ৭, ঢাকা",
    "rating": 5,
    "productName": "গ্রাম্য খাঁটি গাওয়া ঘি (সুস্বাদু দানাদার) - ৫০০ গ্রাম",
    "category": "oil_ghee",
    "comment": "ঘিয়ের সুঘ্রাণে পুরো ঘর ভরে যায়! পরোটা আর গরম ভাতের সাথে খেলে অসাধারণ স্বাদ। দানাদার টেক্সচারটাই আসল প্রমাণ। বারবার এই ঘি অর্ডার করব ইনশাআল্লাহ।",
    "date": "2026-10-05T07:31:34.380Z",
    "isActive": true,
    "isVerified": true,
    "likes": 51
  },
  {
    "id": "rev-5",
    "name": "শফিকুল আলম",
    "email": "shafiqul.raj@outlook.com",
    "phone": "01715667788",
    "location": "বোয়ালিয়া, রাজশাহী",
    "rating": 5,
    "productName": "উইন্টার প্রিমিয়াম কটন হুডি (ব্ল্যাক)",
    "category": "fashion",
    "comment": "হুডির ফেব্রিক কোয়ালিটি অনেক সফট এবং ভারী শীতের জন্য পারফেক্ট। কালার ও ফিটিং ঠিক ছবির মতোই। সাইজ চার্ট দেখে অর্ডার করায় একদম পারফেক্ট সাইজ হয়েছে।",
    "date": "2026-10-03T07:31:34.380Z",
    "isActive": true,
    "isVerified": true,
    "likes": 24
  },
  {
    "id": "rev-6",
    "name": "ডা. আরিফুল করিম",
    "email": "dr.ariful@gmail.com",
    "phone": "01611889900",
    "location": "সোনাডাঙ্গা, খুলনা",
    "rating": 5,
    "productName": "ন্যাচারাল প্রিমিয়াম মিক্সড ড্রাই ফ্রুটস ও বাদাম - ৫০০ গ্রাম",
    "category": "dates",
    "comment": "ক্যাশু, আমন্ড, আখরোট ও কিসমিসের ফ্রেশনেস দারুণ। কোয়ালিটি নিয়ে কোনো সন্দেহ নেই। সকালে নাস্তার সাথে খাওয়ার জন্য সেরা পুষ্টিকর খাবার।",
    "date": "2026-10-01T07:31:34.380Z",
    "isActive": true,
    "isVerified": true,
    "likes": 33
  },
  {
    "id": "rev-7",
    "name": "সামিয়া সুলতানা",
    "email": "samia.sultana@gmail.com",
    "phone": "01822334455",
    "location": "ধানমন্ডি, ঢাকা",
    "rating": 5,
    "productName": "স্মার্ট আল্ট্রা ওয়াচ উইথ ওয়্যারলেস চার্জিং (মেটাল স্ট্র্যাপ)",
    "category": "gadgets",
    "comment": "ঘড়িটি দেখতে চমৎকার ও প্রিমিয়াম লুক দেয়। কলিং ফিচার, ডিসপ্লে ব্রাইটনেস ও ব্যাটারি ব্যাকআপ খুব ভালো। ওয়ারেন্টি কার্ড সাথে পেয়েছি। ধন্যবাদ নিরাপদ ক্রয়।",
    "date": "2026-09-29T07:31:34.380Z",
    "isActive": true,
    "isVerified": true,
    "likes": 47
  },
  {
    "id": "rev-8",
    "name": "ইঞ্জি. কামরুল হাসান",
    "email": "kamrul.hasan.eng@gmail.com",
    "phone": "01718889900",
    "location": "টঙ্গী, গাজীপুর",
    "rating": 5,
    "productName": "খাঁটি কালোজিরা ফুলের মধু - ৫০০ গ্রাম",
    "category": "food",
    "comment": "কালোজিরা ফুলের মধু অনেক ঔষধি গুণসম্পন্ন। স্বাদ একটু গাঢ় ও কড়া যা আসল মধুর লক্ষণ। ডেলিভারি খুব দ্রুত হয়েছে এবং প্রোডাক্ট সম্পূর্ণ অক্ষত পেয়েছি।",
    "date": "2026-09-27T07:31:34.380Z",
    "isActive": true,
    "isVerified": true,
    "likes": 31
  }
];
