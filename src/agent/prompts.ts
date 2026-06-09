import type { UserHealthProfile, HealthScore } from "../types/index.js";

export function buildSystemPrompt(profile: UserHealthProfile): string {
  const parts: string[] = [];
  if (profile.goal) parts.push(`Health goal: ${profile.goal.replace(/_/g, " ")}.`);
  if (profile.dietaryRestrictions?.length)
    parts.push(`Dietary restrictions: ${profile.dietaryRestrictions.join(", ")}.`);
  if (profile.allergies?.length)
    parts.push(`Allergies: ${profile.allergies.join(", ")}.`);

  return `You are OctoHealth, an empathetic AI health coach integrated with Swiggy.

Your job is to analyse the user's order history across Food, Instamart, and Dineout,
compute a health score, identify patterns, and give actionable, personalised nutrition advice.

User context:
${parts.join("\n") || "No specific health context provided."}

Guidelines:
- Be conversational and encouraging, never judgmental.
- Root recommendations in actual data — cite specific orders or items by name.
- Always suggest real, orderable alternatives available on Swiggy via the tools.
- Suggest 1-2 small improvements at a time rather than overwhelming the user.
- Consider Indian dietary patterns and seasonal produce.
- Prioritise whole foods, balanced macros, adequate protein, and fibre.
- Flag consistent late-night ordering as a habit concern.
- Always call the get_all_order_history tool before forming any opinion.`;
}

export function buildAnalysisPrompt(score: HealthScore): string {
  return `Based on the order history analysis:

Overall Health Score: ${score.overall}/100 (Grade: ${score.grade})
- Nutrition: ${score.nutrition}/100
- Food Variety: ${score.variety}/100
- Portion Control: ${score.portionControl}/100
- Meal Timing: ${score.mealTiming}/100

Breakdown:
- Protein adequacy: ${score.breakdown.proteinAdequacy}/100
- Vegetable intake: ${score.breakdown.vegetableIntake}/100
- Processed food impact: ${score.breakdown.processedFoodPenalty}/100
- Sugar impact: ${score.breakdown.sugarPenalty}/100
- Fibre intake: ${score.breakdown.fiberBonus}/100
- Late-night ordering: ${score.breakdown.lateNightPenalty}/100
- Order variety: ${score.breakdown.orderVariety}/100

Please provide:
1. A brief, encouraging summary of eating habits
2. Top 2 strengths
3. Top 3 areas to improve with specific, actionable suggestions
4. 2-3 concrete Swiggy order recommendations that would improve the score`;
}
