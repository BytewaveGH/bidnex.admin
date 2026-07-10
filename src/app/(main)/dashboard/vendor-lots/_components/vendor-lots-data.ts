export type LotReviewStatus = "draft" | "submitted" | "approved" | "rejected";

export interface LotImage {
  id: number;
  url: string;
  mediaType: "image" | "video";
  isPrimary: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface LotCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
}

export interface LotAuction {
  id: number;
  title: string;
  description?: string;
  status: string;
  startTime: string;
  endTime: string;
  vendorId: number;
  isFeatured: boolean;
  locationName?: string;
  locationAddress?: string;
  lotCount: number;
  lotInterval: number;
  createdAt: string;
}

export interface VendorLot {
  id: number;
  vendorId: number;
  vendorName?: string; // not returned by API — present in mock data only
  title: string;
  description: string;
  condition: string;
  startingBid: number;
  currentBid: number;
  bidIncrement: number;
  bidCount: number;
  reservePrice: number;
  buyNowPrice: number;
  msrp?: number; // not returned by API — present in mock data only
  status: string;
  reviewStatus: LotReviewStatus;
  reviewRejectReason: string;
  lotOrder?: number;
  sku: string;
  pickupAvailable: boolean;
  shippingAvailable: boolean;
  bidderIds?: number[];
  specifications?: Record<string, string>; // not returned by API — present in mock data only
  category: LotCategory;
  primaryImage: string;
  images: LotImage[];
  createdAt: string;
  auctionId?: number | null;
  recentBids?: unknown[];
  auction?: LotAuction | null;
}

export const vendorLots: VendorLot[] = [
  {
    id: 12884901914,
    vendorId: 3,
    vendorName: "Kofi Mensah Supplies",
    title: "Simpson Cleaning 4000 PSI Gas Pressure Washer, 4.0 GPM Power Washer for Hot Water Use",
    description:
      "Industrial Performance: Easy-to-start with its CRX 420 direct drive engine, this hot-water gas powered pressure washer is perfectly suited to power wash the toughest grease and oil stains from industrial equipment, factory floors, and fleet vehicles.\n\nPower and Durability: A powerful, reliable, premium AAA industrial triplex plunger pump on the power washer delivers 4000 PSI at 4.0 GPM and includes an external unloader and bypass hose. Engine has a low-oil shutdown feature to provide long life.",
    condition: "new",
    startingBid: 1.0,
    currentBid: 5.0,
    bidIncrement: 1.0,
    bidCount: 0,
    reservePrice: 1.0,
    buyNowPrice: 1.0,
    msrp: 1499.0,
    status: "pending",
    reviewStatus: "submitted",
    reviewRejectReason: "",
    sku: "SIMP-4000-PSI",
    pickupAvailable: true,
    shippingAvailable: true,
    specifications: {
      Brand: "Simpson",
      Color: "Red",
      Dimension: '42"L x 28"W x 47.5"H',
      "Engine Type": "CRX 420 Gas",
      PSI: "4000",
      GPM: "4.0",
    },
    category: {
      id: 25769803778,
      name: "Home/Kitchen",
      slug: "home-kitchen",
      description: "Discover household and kitchen items that make everyday living easier.",
      createdAt: "2026-06-11T10:52:25Z",
    },
    primaryImage: "https://picsum.photos/seed/washer-a/800/600",
    images: [
      {
        id: 1001,
        url: "https://picsum.photos/seed/washer-a/800/600",
        mediaType: "image",
        isPrimary: true,
        displayOrder: 0,
        createdAt: "2026-06-13T20:36:15Z",
      },
      {
        id: 1002,
        url: "https://picsum.photos/seed/washer-b/800/600",
        mediaType: "image",
        isPrimary: false,
        displayOrder: 1,
        createdAt: "2026-06-13T20:36:15Z",
      },
    ],
    createdAt: "2026-06-13T20:36:14Z",
  },
  {
    id: 12884901915,
    vendorId: 5,
    vendorName: "TechHub Ghana Ltd.",
    title: "Apple iPhone 15 Pro Max 256GB — Natural Titanium, Unlocked",
    description:
      "Brand new sealed box. Apple iPhone 15 Pro Max with A17 Pro chip, 48MP main camera system, titanium design, and USB-C connector. Compatible with all networks worldwide.\n\nIncludes original Apple accessories: USB-C cable, documentation. All Apple warranty seals intact.",
    condition: "new",
    startingBid: 2500.0,
    currentBid: 2500.0,
    bidIncrement: 50.0,
    bidCount: 0,
    reservePrice: 3000.0,
    buyNowPrice: 4200.0,
    msrp: 5500.0,
    status: "active",
    reviewStatus: "approved",
    reviewRejectReason: "",
    sku: "APPL-IP15PM-256-NT",
    pickupAvailable: true,
    shippingAvailable: true,
    specifications: {
      Brand: "Apple",
      Model: "iPhone 15 Pro Max",
      Storage: "256GB",
      Color: "Natural Titanium",
      Chip: "A17 Pro",
      Connectivity: "5G, Wi-Fi 6E, Bluetooth 5.3",
    },
    category: {
      id: 25769803779,
      name: "Phones & Accessories",
      slug: "phones-accessories",
      description: "Get smartphones, chargers, and accessories through competitive auction bidding.",
      createdAt: "2026-06-11T10:52:25Z",
    },
    primaryImage: "https://picsum.photos/seed/phone-a/800/600",
    images: [
      {
        id: 2001,
        url: "https://picsum.photos/seed/phone-a/800/600",
        mediaType: "image",
        isPrimary: true,
        displayOrder: 0,
        createdAt: "2026-06-10T14:20:00Z",
      },
      {
        id: 2002,
        url: "https://picsum.photos/seed/phone-b/800/600",
        mediaType: "image",
        isPrimary: false,
        displayOrder: 1,
        createdAt: "2026-06-10T14:20:00Z",
      },
      {
        id: 2003,
        url: "https://picsum.photos/seed/phone-c/800/600",
        mediaType: "image",
        isPrimary: false,
        displayOrder: 2,
        createdAt: "2026-06-10T14:20:00Z",
      },
    ],
    createdAt: "2026-06-10T14:18:00Z",
  },
  {
    id: 12884901916,
    vendorId: 2,
    vendorName: "Accra Luxury Traders",
    title: "Rolex Submariner Date (1985) — Ref. 16800, Box & Papers",
    description:
      "Excellent condition vintage Rolex Submariner. Original dial with correct tritium hands and indices. No polishing — all original surfaces retained. The watch runs within COSC specifications.\n\nComes with original box and service papers dated 2019 from an authorised Rolex dealer. A rare opportunity to acquire a complete example.",
    condition: "excellent",
    startingBid: 4000.0,
    currentBid: 4000.0,
    bidIncrement: 100.0,
    bidCount: 0,
    reservePrice: 5500.0,
    buyNowPrice: 7500.0,
    msrp: 7000.0,
    status: "active",
    reviewStatus: "approved",
    reviewRejectReason: "",
    sku: "ROLX-SUB-16800-85",
    pickupAvailable: true,
    shippingAvailable: false,
    specifications: {
      Brand: "Rolex",
      Model: "Submariner Date",
      Reference: "16800",
      Year: "1985",
      Movement: "Calibre 3035 Automatic",
      Material: "Stainless Steel",
      "Case Size": "40mm",
    },
    category: {
      id: 25769803780,
      name: "Clothes",
      slug: "clothes",
      description: "Fashion and accessories.",
      createdAt: "2026-06-11T10:52:25Z",
    },
    primaryImage: "https://picsum.photos/seed/watch-a/800/600",
    images: [
      {
        id: 3001,
        url: "https://picsum.photos/seed/watch-a/800/600",
        mediaType: "image",
        isPrimary: true,
        displayOrder: 0,
        createdAt: "2026-06-08T09:00:00Z",
      },
      {
        id: 3002,
        url: "https://picsum.photos/seed/watch-b/800/600",
        mediaType: "image",
        isPrimary: false,
        displayOrder: 1,
        createdAt: "2026-06-08T09:00:00Z",
      },
    ],
    createdAt: "2026-06-08T09:00:00Z",
  },
  {
    id: 12884901917,
    vendorId: 7,
    vendorName: "Dansoman Electronics",
    title: 'Samsung 65" QLED 4K Smart TV — QN65QN90CAFXZA',
    description:
      "Neo QLED with Quantum Matrix Technology and Neural Quantum Processor 4K. Minor scratch on left bezel, otherwise excellent working condition. Remote and all original cables included.\n\nThe Tizen OS Smart TV features built-in Amazon Alexa and Google Assistant compatibility.",
    condition: "good",
    startingBid: 1800.0,
    currentBid: 1800.0,
    bidIncrement: 50.0,
    bidCount: 0,
    reservePrice: 2200.0,
    buyNowPrice: 3000.0,
    msrp: 2800.0,
    status: "rejected",
    reviewStatus: "rejected",
    reviewRejectReason:
      "Listing photos do not match the described condition. The scratch on the bezel appears larger than disclosed. Please resubmit with accurate photos showing all damage clearly.",
    sku: "SMSNG-QN65QN90C",
    pickupAvailable: true,
    shippingAvailable: false,
    specifications: {
      Brand: "Samsung",
      Model: "QN65QN90CAFXZA",
      "Screen Size": '65"',
      Resolution: "4K UHD (3840 x 2160)",
      "Display Type": "Neo QLED",
      "Smart TV OS": "Tizen",
    },
    category: {
      id: 25769803781,
      name: "Electronics",
      slug: "electronics",
      description: "Electronics",
      createdAt: "2026-06-11T10:52:25Z",
    },
    primaryImage: "https://picsum.photos/seed/tv-a/800/600",
    images: [
      {
        id: 4001,
        url: "https://picsum.photos/seed/tv-a/800/600",
        mediaType: "image",
        isPrimary: true,
        displayOrder: 0,
        createdAt: "2026-06-07T11:30:00Z",
      },
      {
        id: 4002,
        url: "https://picsum.photos/seed/tv-b/800/600",
        mediaType: "image",
        isPrimary: false,
        displayOrder: 1,
        createdAt: "2026-06-07T11:30:00Z",
      },
    ],
    createdAt: "2026-06-07T11:30:00Z",
  },
  {
    id: 12884901918,
    vendorId: 4,
    vendorName: "Abena Gold & Jewels",
    title: "22k Gold Rope Necklace Set — 45g, Hallmarked, With Certificate",
    description:
      "Hand-crafted 22k yellow gold rope chain necklace. Weight: 45g. The piece has been assayed and hallmarked by an accredited authority.\n\nComes with GIA certificate of authenticity and hallmark certificate. Ideal for gifting or investment.",
    condition: "excellent",
    startingBid: 1500.0,
    currentBid: 1500.0,
    bidIncrement: 25.0,
    bidCount: 0,
    reservePrice: 1800.0,
    buyNowPrice: 2500.0,
    msrp: 3200.0,
    status: "draft",
    reviewStatus: "draft",
    reviewRejectReason: "",
    sku: "GOLD-22K-ROPE-45G",
    pickupAvailable: true,
    shippingAvailable: true,
    specifications: {
      Metal: "22k Yellow Gold",
      Weight: "45g",
      Purity: "22 Karat (916)",
      Length: '22"',
      Certificate: "GIA + Hallmark",
    },
    category: {
      id: 25769803782,
      name: "Clothes",
      slug: "clothes",
      description: "Fashion and accessories.",
      createdAt: "2026-06-11T10:52:25Z",
    },
    primaryImage: "https://picsum.photos/seed/jewelry-a/800/600",
    images: [
      {
        id: 5001,
        url: "https://picsum.photos/seed/jewelry-a/800/600",
        mediaType: "image",
        isPrimary: true,
        displayOrder: 0,
        createdAt: "2026-06-12T16:00:00Z",
      },
      {
        id: 5002,
        url: "https://picsum.photos/seed/jewelry-b/800/600",
        mediaType: "image",
        isPrimary: false,
        displayOrder: 1,
        createdAt: "2026-06-12T16:00:00Z",
      },
    ],
    createdAt: "2026-06-12T16:00:00Z",
  },
];
