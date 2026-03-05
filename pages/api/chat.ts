// pages/api/chat.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { ModelInput, ModelOutput } from '../../ai-contract';
import { BookingEngine } from '../../booking-engine';
import { AvailabilityManager } from '../../business-availability';
// You'll need an LLM client (e.g., OpenAI/Anthropic SDK)
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const bookingEngine = new BookingEngine();
const availabilityManager = new AvailabilityManager();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { message, userId, businessId, history } = req.body;

  // 1. Fetch Real Context (Services + Policy)
  // TODO: Use real DB call
  const services = [
    { id: 'srv_123', name: 'Standard Haircut', durationMin: 60, priceCents: 5000 }
  ];
  const policy = { cancellationHours: 24, depositRequired: true };

  // 2. Construct Prompt for LLM
  const input: ModelInput = {
    user: { id: userId, name: 'User', isReturning: true },
    business: { id: businessId, name: 'Demo Salon', timezone: 'Australia/Melbourne', policy },
    availableServices: services,
    conversationHistory: history,
    currentMessage: message
  };

  const systemPrompt = `
    You are a helpful booking assistant for Demo Salon.
    Your goal is to help the user book a service or answer questions.
    
    CRITICAL RULES:
    1. Output strictly JSON matching the ModelOutput schema.
    2. Do NOT hallucinate services. Only offer: ${services.map(s => s.name).join(', ')}.
    3. Check policy: Cancellation requires ${policy.cancellationHours}h notice.
    
    SCHEMA:
    {
      "reasoning": "string",
      "intent": "BOOKING_REQUEST" | "QUERY" | "OTHER",
      "bookingDetails": { "serviceId": "string | null", "suggestedDate": "YYYY-MM-DD | null", "suggestedTime": "HH:MM | null" },
      "replyToUser": "string"
    }
  `;

  try {
    // 3. Call LLM (with JSON Mode)
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(input) }
      ],
      response_format: { type: "json_object" }
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || '{}') as ModelOutput;

    // 4. ACTION: If AI detects a booking intent with full details, check availability
    if (aiResponse.intent === 'BOOKING_REQUEST' && aiResponse.bookingDetails?.suggestedDate && aiResponse.bookingDetails?.suggestedTime) {
      const { suggestedDate, suggestedTime, serviceId } = aiResponse.bookingDetails;
      
      // Check if open
      const requestedTime = new Date(`${suggestedDate}T${suggestedTime}:00.000Z`);
      const isOpen = await availabilityManager.isBusinessOpen(businessId, requestedTime);
      
      if (!isOpen) {
        aiResponse.replyToUser = `I checked, but the salon is closed at ${suggestedTime} on ${suggestedDate}. Would you like to try another time?`;
        aiResponse.bookingDetails = undefined; // Clear invalid details
      } else {
        // Slot is valid -> Frontend can show "Confirm" button
        aiResponse.replyToUser = `Great! I found a slot for ${suggestedDate} at ${suggestedTime}. Would you like to confirm?`;
      }
    }

    return res.status(200).json(aiResponse);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'AI processing failed' });
  }
}
