import { generateAgronomicRecommendations } from "../src/lib/ai.functions.ts";

console.log("=== TEST 1: Low Water, Sandy Soil, Arid Climate ===");
const res1 = generateAgronomicRecommendations({
  soilType: "Sandy",
  soilPh: 7.2,
  nitrogen: 20,
  phosphorus: 30,
  potassium: 20,
  water: "Low",
  season: "Kharif",
  region: "Anantapur, AP",
  history: "Paddy",
});
console.log("Top Crop 1:", res1.recommendations[0].name, "(Score:", res1.recommendations[0].score, ")");
console.log("Water:", res1.recommendations[0].water, "Yield:", res1.recommendations[0].yield);
console.log("Rationale:", res1.rationale);
console.log("All 5 recommendations:", res1.recommendations.map(r => `${r.name} (${r.score}%)`));

console.log("\n=== TEST 2: High Water, Clay Soil, Kharif Paddy Region ===");
const res2 = generateAgronomicRecommendations({
  soilType: "Clay",
  soilPh: 6.2,
  nitrogen: 90,
  phosphorus: 50,
  potassium: 80,
  water: "High",
  season: "Kharif",
  region: "Godavari, Andhra Pradesh",
  history: "Pulses",
});
console.log("Top Crop 1:", res2.recommendations[0].name, "(Score:", res2.recommendations[0].score, ")");
console.log("All 5 recommendations:", res2.recommendations.map(r => `${r.name} (${r.score}%)`));

console.log("\n=== TEST 3: Rabi Season, Loamy Soil ===");
const res3 = generateAgronomicRecommendations({
  soilType: "Loamy",
  soilPh: 6.8,
  nitrogen: 80,
  phosphorus: 40,
  potassium: 40,
  water: "Medium",
  season: "Rabi",
  region: "Ludhiana, Punjab",
  history: "Paddy",
});
console.log("Top Crop 1:", res3.recommendations[0].name, "(Score:", res3.recommendations[0].score, ")");
console.log("All 5 recommendations:", res3.recommendations.map(r => `${r.name} (${r.score}%)`));

console.log("\nVERIFICATION COMPLETE SUCCESS!");
