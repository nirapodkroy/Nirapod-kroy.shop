import { SizeChart, SizeChartRow } from "../types";

export interface SizePreset {
  id: string;
  name: string;
  categoryHint: string;
  sizes: string[];
  chart: SizeChart;
}

export const SIZE_PRESETS: SizePreset[] = [
  {
    id: "panjabi_shirt_classic",
    name: "শার্ট / পাঞ্জাবি মাপ (S - XXL)",
    categoryHint: "শার্ট, পাঞ্জাবি, কাবলি, ফতুয়া",
    sizes: ["S", "M", "L", "XL", "XXL"],
    chart: {
      unit: 'ইঞ্চি (Inches)',
      columns: ["S", "M", "L", "XL", "XXL"],
      note: "* সকল মাপ ইঞ্চিতে (Inches) দেওয়া হয়েছে। সামান্য (+/- ০.৫\") পার্থক্য হতে পারে।",
      rows: [
        {
          name: 'গলা (Neck)',
          values: { S: '14.5"', M: '15"', L: '15.5"', XL: '16"', XXL: '16.5"' }
        },
        {
          name: 'বুক (Chest)',
          values: { S: '36"', M: '38"', L: '40"', XL: '42"', XXL: '44"' }
        },
        {
          name: 'কাঁধ (Shoulder)',
          values: { S: '16"', M: '17"', L: '18"', XL: '19"', XXL: '20"' }
        },
        {
          name: 'লম্বা (Length)',
          values: { S: '27"', M: '28"', L: '29"', XL: '30"', XXL: '31"' }
        },
        {
          name: 'হাতা (Sleeve)',
          values: { S: '23"', M: '24"', L: '24.5"', XL: '25"', XXL: '25.5"' }
        },
        {
          name: 'হাতার প্রস্থ',
          values: { S: '7"', M: '7.5"', L: '8"', XL: '8.5"', XXL: '9"' }
        },
        {
          name: 'নিচের প্রস্থ',
          values: { S: '18"', M: '19"', L: '20"', XL: '21"', XXL: '22"' }
        }
      ]
    }
  },
  {
    id: "panjabi_numeric",
    name: "পাঞ্জাবি সংখ্যা সাইজ (৩৮ - ৪৬)",
    categoryHint: "পাঞ্জাবি, কুর্তা, কোটি",
    sizes: ["38", "40", "42", "44", "46"],
    chart: {
      unit: 'ইঞ্চি (Inches)',
      columns: ["38", "40", "42", "44", "46"],
      note: "* সকল মাপ ইঞ্চিতে (Inches) দেওয়া হয়েছে।",
      rows: [
        {
          name: 'গলা (Neck)',
          values: { "38": '14.5"', "40": '15"', "42": '15.5"', "44": '16"', "46": '16.5"' }
        },
        {
          name: 'বুক (Chest)',
          values: { "38": '38"', "40": '40"', "42": '42"', "44": '44"', "46": '46"' }
        },
        {
          name: 'কাঁধ (Shoulder)',
          values: { "38": '17"', "40": '17.5"', "42": '18"', "44": '18.5"', "46": '19"' }
        },
        {
          name: 'লম্বা (Length)',
          values: { "38": '38"', "40": '40"', "42": '42"', "44": '44"', "46": '46"' }
        },
        {
          name: 'হাতা (Sleeve)',
          values: { "38": '24"', "40": '24.5"', "42": '25"', "44": '25.5"', "46": '26"' }
        },
        {
          name: 'হাতার প্রস্থ',
          values: { "38": '7.5"', "40": '8"', "42": '8.5"', "44": '9"', "46": '9.5"' }
        },
        {
          name: 'নিচের প্রস্থ',
          values: { "38": '20"', "40": '21"', "42": '22"', "44": '23"', "46": '24"' }
        }
      ]
    }
  },
  {
    id: "tshirt_polo",
    name: "টি-শার্ট / পোলো (M - XXL)",
    categoryHint: "টি-শার্ট, পোলো শার্ট, ড্রপ শোল্ডার",
    sizes: ["M", "L", "XL", "XXL"],
    chart: {
      unit: 'ইঞ্চি (Inches)',
      columns: ["M", "L", "XL", "XXL"],
      note: "* সকল মাপ ইঞ্চিতে। বডি মাপের সাথে মিলিয়ে সাইজ নির্বাচন করুন।",
      rows: [
        {
          name: 'বুক (Chest)',
          values: { M: '38"', L: '40"', XL: '42"', XXL: '44"' }
        },
        {
          name: 'লম্বা (Length)',
          values: { M: '27"', L: '28"', XL: '29"', XXL: '30"' }
        },
        {
          name: 'কাঁধ (Shoulder)',
          values: { M: '16.5"', L: '17.5"', XL: '18.5"', XXL: '19.5"' }
        },
        {
          name: 'হাতা (Sleeve)',
          values: { M: '8"', L: '8.5"', XL: '9"', XXL: '9.5"' }
        }
      ]
    }
  },
  {
    id: "pants_jeans",
    name: "প্যান্ট / জিন্স / ট্রাউজার্স (২৮ - ৩৮)",
    categoryHint: "প্যান্ট, জিন্স, ট্রাউজার্স, পায়জামা",
    sizes: ["28", "30", "32", "34", "36", "38"],
    chart: {
      unit: 'ইঞ্চি (Inches)',
      columns: ["28", "30", "32", "34", "36", "38"],
      note: "* কোমর ও লম্বা ইঞ্চিতে দেওয়া আছে।",
      rows: [
        {
          name: 'কোমর (Waist)',
          values: { "28": '28"', "30": '30"', "32": '32"', "34": '34"', "36": '36"', "38": '38"' }
        },
        {
          name: 'লম্বা (Length)',
          values: { "28": '38"', "30": '39"', "32": '40"', "34": '41"', "36": '42"', "38": '42"' }
        },
        {
          name: 'থাই (Thigh)',
          values: { "28": '22"', "30": '23"', "32": '24"', "34": '25"', "36": '26"', "38": '27"' }
        },
        {
          name: 'নিচের মুহুরি',
          values: { "28": '12"', "30": '13"', "32": '13.5"', "34": '14"', "36": '14.5"', "38": '15"' }
        }
      ]
    }
  },
  {
    id: "shoes_footwear",
    name: "জুতা / স্যান্ডেল (৩৯ - ৪৪)",
    categoryHint: "জুতা, স্নিকার্স, স্যান্ডেল, লোফার",
    sizes: ["39", "40", "41", "42", "43", "44"],
    chart: {
      unit: 'সেন্টিমিটার (CM)',
      columns: ["39", "40", "41", "42", "43", "44"],
      note: "* পায়ের মোট দৈর্ঘ্য সেন্টিমিটারে পরিমাপ করুন।",
      rows: [
        {
          name: 'পায়ের দৈর্ঘ্য (CM)',
          values: { "39": '24.5', "40": '25.0', "41": '25.5', "42": '26.0', "43": '26.5', "44": '27.0' }
        },
        {
          name: 'UK / BD Size',
          values: { "39": '5', "40": '6', "41": '7', "42": '8', "43": '9', "44": '10' }
        },
        {
          name: 'EU Size',
          values: { "39": '39', "40": '40', "41": '41', "42": '42', "43": '43', "44": '44' }
        }
      ]
    }
  }
];

export interface SizeChartPresetItem {
  id: string;
  name: string;
  categoryHint: string;
  title: string;
  sizes: string[];
  unit: string;
  columns: string[];
  rows: SizeChartRow[];
  note: string;
}

export const SIZE_CHART_PRESETS: SizeChartPresetItem[] = SIZE_PRESETS.map((p) => ({
  id: p.id,
  name: p.name,
  categoryHint: p.categoryHint,
  title: p.chart.title || p.name,
  sizes: p.sizes,
  unit: p.chart.unit || 'ইঞ্চি (Inches)',
  columns: p.chart.columns,
  rows: p.chart.rows,
  note: p.chart.note || ''
}));

export function createDefaultChartForSizes(sizes: string[]): SizeChart {
  const cleanSizes = sizes.map(s => s.trim()).filter(Boolean);
  return {
    unit: 'ইঞ্চি (Inches)',
    columns: cleanSizes,
    note: '* সকল মাপ ইঞ্চিতে দেওয়া আছে।',
    rows: [
      {
        name: 'বুক (Chest)',
        values: cleanSizes.reduce((acc, s) => ({ ...acc, [s]: '' }), {})
      },
      {
        name: 'লম্বা (Length)',
        values: cleanSizes.reduce((acc, s) => ({ ...acc, [s]: '' }), {})
      },
      {
        name: 'কাঁধ (Shoulder)',
        values: cleanSizes.reduce((acc, s) => ({ ...acc, [s]: '' }), {})
      }
    ]
  };
}
