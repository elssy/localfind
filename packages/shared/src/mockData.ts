import type {
  Seeker,
  Provider,
  Bid,
  Transaction,
  TokenBundle,
  TokenPurchase,
  Review,
  SearchAlert,
  Dispute,
  ActivityEvent,
  Category,
} from "./types";

export const seekers: Seeker[] = [
  { id: "s1", name: "Amina Wanjiru", phone: "+254712345678", avatar: null },
  { id: "s2", name: "Brian Otieno", phone: "+254798765432", avatar: null },
];

export const providers: Provider[] = [
  {
    id: "p1",
    name: "Glam Studio by Njeri",
    category: "Beauty & Wellness",
    subcategory: "Nail Salon",
    rating: 4.8,
    reviewCount: 124,
    lat: -1.2847,
    lng: 36.8235,
    address: "Westlands, Nairobi",
    tokenBalance: 45,
    bio: "Professional nail art and beauty services",
    photos: [],
    verified: true,
    responseTime: "~10 min",
    status: "active",
    joinedAt: "2024-02-14",
    services: [
      { name: "Manicure", price: 500 },
      { name: "Pedicure", price: 700 },
      { name: "Gel nails", price: 1500 },
    ],
  },
  {
    id: "p2",
    name: "Mwangi Plumbing Works",
    category: "Home Services",
    subcategory: "Plumber",
    rating: 4.5,
    reviewCount: 89,
    lat: -1.3001,
    lng: 36.81,
    address: "Dagoretti, Nairobi",
    tokenBalance: 12,
    bio: "Licensed plumber, 10 years experience",
    photos: [],
    verified: true,
    responseTime: "~15 min",
    status: "active",
    joinedAt: "2023-11-02",
    services: [
      { name: "Pipe repair", price: 1500 },
      { name: "Drain unblocking", price: 2000 },
      { name: "Full installation", price: 8000 },
    ],
  },
  {
    id: "p3",
    name: "Kariuki Auto Garage",
    category: "Auto Services",
    subcategory: "Mechanic",
    rating: 4.6,
    reviewCount: 201,
    lat: -1.27,
    lng: 36.832,
    address: "Pangani, Nairobi",
    tokenBalance: 78,
    bio: "Full auto service and repairs, all makes",
    photos: [],
    verified: true,
    responseTime: "~8 min",
    status: "active",
    joinedAt: "2023-05-20",
    services: [
      { name: "Oil change", price: 2500 },
      { name: "Brake service", price: 5000 },
      { name: "Full diagnostic", price: 3500 },
    ],
  },
  {
    id: "p4",
    name: "Mama Wanjiku Catering",
    category: "Food & Catering",
    subcategory: "Caterer",
    rating: 4.9,
    reviewCount: 56,
    lat: -1.295,
    lng: 36.845,
    address: "Kilimani, Nairobi",
    tokenBalance: 3,
    bio: "Authentic Kenyan cuisine for events and homes",
    photos: [],
    verified: false,
    responseTime: "~20 min",
    status: "pending",
    joinedAt: "2024-08-09",
    services: [
      { name: "Full meal (per person)", price: 800 },
      { name: "Event catering (min 20 pax)", price: 12000 },
    ],
  },
  {
    id: "p5",
    name: "Advocate Rose Kamau",
    category: "Legal & Professional",
    subcategory: "Lawyer",
    rating: 4.7,
    reviewCount: 33,
    lat: -1.288,
    lng: 36.818,
    address: "CBD, Nairobi",
    tokenBalance: 22,
    bio: "Advocate of the High Court, specialising in commercial and family law",
    photos: [],
    verified: true,
    responseTime: "~30 min",
    status: "active",
    joinedAt: "2024-01-30",
    services: [
      { name: "Affidavit signing", price: 3000 },
      { name: "Contract review", price: 8000 },
      { name: "Consultation (1hr)", price: 5000 },
    ],
  },
];

export const mockBids: Bid[] = [
  {
    id: "b1",
    providerId: "p1",
    requestId: "r1",
    amount: 1500,
    note: "Available now, can do gel nails within 30 mins",
    eta: "30 min",
    submittedAt: new Date().toISOString(),
  },
  {
    id: "b2",
    providerId: "p3",
    requestId: "r1",
    amount: 1200,
    note: "Offering a discount today only!",
    eta: "45 min",
    submittedAt: new Date().toISOString(),
  },
];

export const transactions: Transaction[] = [
  {
    id: "t1",
    seekerId: "s1",
    providerId: "p1",
    amount: 1500,
    fee: 75,
    status: "in_escrow",
    service: "Gel nails",
    createdAt: new Date().toISOString(),
  },
  {
    id: "t2",
    seekerId: "s2",
    providerId: "p3",
    amount: 2500,
    fee: 125,
    status: "released",
    service: "Oil change",
    createdAt: new Date().toISOString(),
  },
  {
    id: "t3",
    seekerId: "s1",
    providerId: "p2",
    amount: 2000,
    fee: 100,
    status: "disputed",
    service: "Drain unblocking",
    createdAt: new Date().toISOString(),
  },
];

export const tokenBundles: TokenBundle[] = [
  { id: "starter", name: "Starter", alerts: 20, price: 200, pricePerAlert: 10 },
  { id: "standard", name: "Standard", alerts: 50, price: 450, pricePerAlert: 9, tag: "Popular" },
  { id: "pro", name: "Pro", alerts: 100, price: 800, pricePerAlert: 8 },
  { id: "business", name: "Business", alerts: 250, price: 1750, pricePerAlert: 7 },
];

export const tokenPurchases: TokenPurchase[] = [
  { id: "tp1", providerId: "p1", bundleId: "standard", tokens: 50, amountPaid: 450, date: "2025-05-01" },
  { id: "tp2", providerId: "p3", bundleId: "pro", tokens: 100, amountPaid: 800, date: "2025-05-10" },
  { id: "tp3", providerId: "p5", bundleId: "starter", tokens: 20, amountPaid: 200, date: "2025-06-02" },
  { id: "tp4", providerId: "p2", bundleId: "starter", tokens: 20, amountPaid: 200, date: "2025-06-15" },
];

export const reviews: Review[] = [
  { id: "rv1", providerId: "p1", authorName: "Amina W.", rating: 5, text: "Amazing nail art, very professional!", date: "2025-05-20" },
  { id: "rv2", providerId: "p1", authorName: "Faith N.", rating: 5, text: "Quick and clean service.", date: "2025-05-15" },
  { id: "rv3", providerId: "p1", authorName: "Grace K.", rating: 4, text: "Good but slightly pricey.", date: "2025-05-02" },
  { id: "rv4", providerId: "p3", authorName: "Brian O.", rating: 5, text: "Fixed my car fast, fair pricing.", date: "2025-06-01" },
  { id: "rv5", providerId: "p3", authorName: "Peter M.", rating: 4, text: "Reliable mechanic.", date: "2025-05-22" },
  { id: "rv6", providerId: "p3", authorName: "Susan W.", rating: 5, text: "Best garage in Pangani.", date: "2025-04-30" },
];

export const searchAlerts: SearchAlert[] = [
  { id: "al1", providerId: "p1", query: "Nail salon", category: "Beauty & Wellness", location: "Westlands, Nairobi", distanceKm: 1.4, createdAt: new Date(Date.now() - 2 * 60000).toISOString(), budgetMin: 1000, budgetMax: 2000, status: "new" },
  { id: "al2", providerId: "p1", query: "Gel nails", category: "Beauty & Wellness", location: "Parklands, Nairobi", distanceKm: 2.1, createdAt: new Date(Date.now() - 15 * 60000).toISOString(), budgetMin: 1200, budgetMax: 1800, status: "new" },
  { id: "al3", providerId: "p3", query: "Oil change", category: "Auto Services", location: "Pangani, Nairobi", distanceKm: 0.8, createdAt: new Date(Date.now() - 5 * 60000).toISOString(), budgetMin: 2000, budgetMax: 3000, status: "new" },
];

export const disputes: Dispute[] = [
  {
    id: "d1",
    transactionId: "t3",
    seekerId: "s1",
    providerId: "p2",
    amount: 2000,
    reason: "Drain still blocked after service, provider unresponsive.",
    status: "open",
    createdAt: new Date().toISOString(),
  },
];

export const activityFeed: ActivityEvent[] = [
  { id: "ev1", type: "provider_registered", description: "Mama Wanjiku Catering registered", timestamp: new Date(Date.now() - 3600_000).toISOString(), status: "pending" },
  { id: "ev2", type: "bid_accepted", description: "Amina accepted Glam Studio's bid", timestamp: new Date(Date.now() - 7200_000).toISOString(), status: "in_escrow" },
  { id: "ev3", type: "payment_released", description: "Payment released to Kariuki Auto Garage", timestamp: new Date(Date.now() - 10800_000).toISOString(), status: "released" },
  { id: "ev4", type: "token_purchase", description: "Advocate Rose Kamau bought Starter bundle", timestamp: new Date(Date.now() - 14400_000).toISOString(), status: "completed" },
  { id: "ev5", type: "dispute_raised", description: "Amina raised a dispute on Mwangi Plumbing job", timestamp: new Date(Date.now() - 18000_000).toISOString(), status: "open" },
  { id: "ev6", type: "provider_registered", description: "Kariuki Auto Garage registered", timestamp: new Date(Date.now() - 5 * 86400_000).toISOString(), status: "active" },
  { id: "ev7", type: "bid_accepted", description: "Brian accepted Kariuki Auto Garage's bid", timestamp: new Date(Date.now() - 6 * 86400_000).toISOString(), status: "released" },
  { id: "ev8", type: "token_purchase", description: "Kariuki Auto Garage bought Pro bundle", timestamp: new Date(Date.now() - 7 * 86400_000).toISOString(), status: "completed" },
  { id: "ev9", type: "payment_released", description: "Payment released to Glam Studio by Njeri", timestamp: new Date(Date.now() - 8 * 86400_000).toISOString(), status: "released" },
  { id: "ev10", type: "provider_registered", description: "Advocate Rose Kamau registered", timestamp: new Date(Date.now() - 9 * 86400_000).toISOString(), status: "active" },
];

export const categories: Category[] = [
  { name: "Beauty & Wellness", icon: "cut", active: true },
  { name: "Home Services", icon: "home", active: true },
  { name: "Auto Services", icon: "car", active: true },
  { name: "Food & Catering", icon: "utensils", active: true },
  { name: "Legal & Professional", icon: "briefcase", active: true },
  { name: "General Retail", icon: "shopping-bag", active: true },
];

export const dailySearches30d: { date: string; searches: number }[] = Array.from(
  { length: 30 },
  (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
      date: d.toISOString().slice(0, 10),
      searches: Math.round(20 + i * 1.8 + Math.sin(i / 3) * 6),
    };
  }
);

export const searchesByCategory = [
  { category: "Beauty & Wellness", percent: 42 },
  { category: "Home Services", percent: 28 },
  { category: "Auto Services", percent: 18 },
  { category: "Food & Catering", percent: 8 },
  { category: "Legal & Professional", percent: 4 },
];

export const revenueBreakdown = [
  { source: "Escrow fees", percent: 38 },
  { source: "Token sales", percent: 62 },
];

export const tokenRevenueByWeek: { week: string; revenue: number }[] = [
  { week: "Wk 1", revenue: 5200 },
  { week: "Wk 2", revenue: 6100 },
  { week: "Wk 3", revenue: 4800 },
  { week: "Wk 4", revenue: 7300 },
  { week: "Wk 5", revenue: 8100 },
  { week: "Wk 6", revenue: 7600 },
  { week: "Wk 7", revenue: 9200 },
  { week: "Wk 8", revenue: 8750 },
];

export const mockChatMessages = (jobId: string) => [
  { id: "m1", jobId, sender: "provider" as const, text: "Hi! I'm on my way, should be there in 30 minutes.", timestamp: new Date(Date.now() - 20 * 60000).toISOString() },
  { id: "m2", jobId, sender: "seeker" as const, text: "Great, thank you! I'm at the address I shared.", timestamp: new Date(Date.now() - 18 * 60000).toISOString() },
  { id: "m3", jobId, sender: "provider" as const, text: "Perfect, see you soon.", timestamp: new Date(Date.now() - 17 * 60000).toISOString() },
  { id: "m4", jobId, sender: "seeker" as const, text: "👍", timestamp: new Date(Date.now() - 16 * 60000).toISOString() },
];

export const NAIROBI_CENTER = { lat: -1.2921, lng: 36.8219 };
export const MOCK_USER_LOCATION = { lat: -1.2847, lng: 36.8235, address: "Westlands, Nairobi" };
