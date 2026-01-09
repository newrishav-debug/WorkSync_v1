
import { GoogleGenAI } from "@google/genai";
import { Engagement, Idea } from '../types';

/**
 * Generates an executive summary for a client engagement using Gemini AI.
 */
export const generateEngagementSummary = async (engagement: Engagement): Promise<string> => {
  // Always use this initialization pattern for GoogleGenAI with a named parameter
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Format timeline for the prompt
  const timelineText = engagement.timeline
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Newest first
    .map(t => `- [${new Date(t.date).toLocaleDateString()}] (${t.type}): ${t.content}`)
    .join('\n');

  const prompt = `
    You are an AI assistant for a professional Work Tracker. 
    Your task is to generate a concise but comprehensive executive summary of a client engagement based on its timeline of events.
    
    Engagement Details:
    - Account: ${engagement.accountName}
    - Project: ${engagement.name}
    - Current Status: ${engagement.status}

    Timeline of Events (Newest to Oldest):
    ${timelineText}

    Please provide a summary (max 150 words) that highlights:
    1. The most recent significant progress.
    2. Any active issues or risks mentioned (especially if status is At Risk).
    3. The overall trajectory of the engagement.

    Do not use markdown formatting like bold or italics excessively. Keep it professional and paragraph form.
  `;

  try {
    // Query GenAI with both the model name and prompt directly
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Extracting text output from GenerateContentResponse using the .text property
    return response.text || "Unable to generate summary at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate summary via Gemini AI.");
  }
};

/**
 * Generates a summary of an idea's evolution based on its chronological entries.
 */
export const generateIdeaSummary = async (idea: Idea): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Format entries chronologically (oldest to newest for narrative flow)
  const entriesText = (idea.entries || [])
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(e => `- [${new Date(e.timestamp).toLocaleDateString()}]: ${e.content}`)
    .join('\n');

  if (!entriesText.trim()) {
    return "No entries yet to summarize.";
  }

  const prompt = `
    You are an AI assistant helping to summarize the evolution of an idea.
    
    Idea: "${idea.title}"
    Category: ${idea.category}
    Priority: ${idea.priority}
    Status: ${idea.status}

    Chronological Entries (Oldest to Newest):
    ${entriesText}

    Please provide a brief summary (max 80 words) that captures:
    1. The core concept of the idea
    2. How the thinking has evolved over time
    3. Current state or next steps if mentioned

    Write in a natural, conversational tone. No markdown formatting. Keep it concise and insightful.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Unable to generate summary at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate idea summary via Gemini AI.");
  }
};
