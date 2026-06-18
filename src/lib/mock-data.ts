export const farmer = {
  name: "Ramesh Kumar",
  village: "Kothapalli",
  district: "Anantapur",
  state: "Andhra Pradesh",
  farmSize: "4.5 acres",
  language: "English",
  irrigation: "Drip",
};

export const weather = {
  temp: 28,
  humidity: 64,
  rainfall: 12,
  wind: 9,
  condition: "Partly Cloudy",
  forecast: [
    { day: "Mon", t: 29, icon: "☀️" },
    { day: "Tue", t: 30, icon: "🌤️" },
    { day: "Wed", t: 27, icon: "🌧️" },
    { day: "Thu", t: 26, icon: "⛈️" },
    { day: "Fri", t: 28, icon: "🌤️" },
  ],
};

export type CropRec = {
  name: string;
  emoji: string;
  score: number;
  yield: string;
  water: string;
  fertilizer: string;
  profit: string;
  demand: "High" | "Medium" | "Low";
  tips: string;
};

export const recommendations: CropRec[] = [
  { name: "Groundnut", emoji: "🥜", score: 94, yield: "2.4 t/acre", water: "Low", fertilizer: "NPK 20:40:20", profit: "₹48,000/acre", demand: "High", tips: "Sow with onset of monsoon. Avoid waterlogging." },
  { name: "Cotton", emoji: "🌱", score: 89, yield: "12 q/acre", water: "Medium", fertilizer: "NPK 60:30:30", profit: "₹42,000/acre", demand: "High", tips: "Use BT seeds. Monitor pink bollworm weekly." },
  { name: "Maize", emoji: "🌽", score: 86, yield: "28 q/acre", water: "Medium", fertilizer: "Urea + DAP", profit: "₹35,000/acre", demand: "Medium", tips: "Earth up at 30 days. Top-dress nitrogen." },
  { name: "Pigeon Pea", emoji: "🫘", score: 82, yield: "8 q/acre", water: "Low", fertilizer: "DAP 50 kg/acre", profit: "₹30,000/acre", demand: "High", tips: "Intercrop with sorghum for soil health." },
  { name: "Tomato", emoji: "🍅", score: 78, yield: "180 q/acre", water: "High", fertilizer: "NPK 19:19:19", profit: "₹65,000/acre", demand: "Medium", tips: "Stake plants. Spray neem for early blight." },
];

export const alerts = [
  { icon: "🌧️", title: "Rain expected Wednesday", body: "Postpone fertilizer application until Friday." },
  { icon: "🐛", title: "Pest alert: Pink bollworm", body: "Cotton growers nearby reported sightings." },
  { icon: "💰", title: "Groundnut price up 8%", body: "Mandi rate ₹6,400/quintal in Anantapur." },
];

export const schemes = [
  { title: "PM-KISAN", body: "₹6,000/year direct benefit to farmer accounts." },
  { title: "PMFBY", body: "Crop insurance against natural calamities." },
  { title: "KCC", body: "Kisan Credit Card up to ₹3 lakh at 4% interest." },
];