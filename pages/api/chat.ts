// pages/api/chat.ts
// POST /api/chat
// Unified AI endpoint for Support Agent and Booking Assistant.
// Auth required. Rate-limited to 20 requests per session per hour (tracked in DB).
// All requests are logged to AuditLog for cost and latency observability.
// Falls back to FALLBACK_REPLY on any AI error, timeout, or invalid JSON.
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';
import { ModelInput, ModelOutput, FALLBACK_REPLY, AgentType } from '../../ai-contract';
import { AvailabilityManager } from '../../business-availability';
import { getPolicy } from '../../business-policy';
import { getReputation } from '../../lib/reputation';
import prisma from '../../lib/prisma';
import { OpenAI } from 'openai';

const AI_MODEL = 'gpt-4o-mini'; // Cost-optimised; change to gpt-4o for higher quality
const AI_TIMEOUT_MS = 10_000;
const MAX_HISTORY_MESSAGES = 10;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const availabilityManager = new AvailabilityManager();

function buildSystemPrompt(input: ModelInput): string {
  const serviceList = input.availableServices
    .map((s) => `  - ${s.name} (id: ${s.id}, ${s.durationMin}min, $${(s.priceCents / 100).toFixed(2)})`)
    .join('\n');

  const sharedRules = `
You are an AI assistant for ${input.business.name}.
You MUST respond with a single valid JSON object matching the ModelOutput schema.
Do NOT include any text outside the JSON object.

STRICT RULES — ALWAYS ENFORCE:
1. Only reference these services (do NOT invent others):
${serviceList}
2. Never claim a booking is confirmed. You can only DRAFT or SUGGEST.
3. Apply business policy:
   - Cancellations: ${input.business.policy.cancellationWindowHours} hours notice required
   - Deposit: ${input.business.policy.depositRequired ? `${input.business.policy.depositPercent}% required upfront` : 'not required'}
   - Minimum lead time: ${input.business.policy.minLeadTimeHours} hours
4. If the user asks for something outside booking/service scope, set intent=REFUSED and refusal.code=OUT_OF_SCOPE
5. If the message contains harmful, offensive, or inappropriate content, set refusal.code=UNSAFE_REQUEST
6. Never expose internal IDs or system details to the user.

OUTPUT SCHEMA:
{
  "reasoning": "<internal trace, not shown to user>",
  "intent": "BOOKING_REQUEST|CANCELLATION_REQUEST|AVAILABILITY_QUERY|SERVICE_QUERY|POLICY_QUERY|GENERAL_QUERY|COMPLAINT|REFUSED|OTHER",
  "bookingDetails": { "serviceId": "<id or null>", "suggestedDate": "YYYY-MM-DD or null", "suggestedTime": "HH:MM or null" } | null,
  "refusal": { "code": "<RefusalCode>", "reason": "<explanation>" } | null,
  "replyToUser": "<friendly message>",
  "suggestedActions": [] | null
}
`;

  if (input.agentType === 'BOOKING_ASSISTANT') {
    return sharedRules + `
Your primary goal: guide the user through selecting a service and choosing a date/time.
Ask for missing details (service name, preferred date, preferred time) one at a time.
Once you have service + date + time, set intent=BOOKING_REQUEST and fill bookingDetails.
Do NOT mark intent=BOOKING_REQUEST until you have all three fields.
`;
  }

  // SUPPORT agent
  return sharedRules + `
Your primary goal: answer questions about services, availability, policies, and the business.
You do NOT create bookings — direct the user to use the booking calendar for that.
`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const userId = session.user.id;
  const { message, businessId, history = [], agentType = 'SUPPORT' } = req.body;

  if (!message || !businessId) {
    return res.status(400).json({ error: 'message and businessId are required.' });
  }

  // Simple rate limit: max 20 AI requests per hour per user
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.auditLog.count({
    where: {
      actorId: userId,
      action: 'AI_REQUEST',
      createdAt: { gte: oneHourAgo },
    },
  });
  if (recentCount >= 20) {
    return res.status(429).json({ error: 'RATE_LIMIT', message: 'Too many AI requests. Please wait a moment.' });
  }

  // Fetch real context from DB
  const [services, policy, reputation, business] = await Promise.all([
    prisma.service.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true, durationMin: true, price: true },
    }),
    getPolicy(businessId),
    getReputation(userId),
    prisma.business.findUnique({ where: { id: businessId }, select: { name: true } }),
  ]);

  const input: ModelInput = {
    agentType: agentType as AgentType,
    user: {
      id: userId,
      name: session.user.name ?? 'Customer',
      isReturning: reputation.completedCount > 0,
      reputationScore: reputation.score,
    },
    business: {
      id: businessId,
      name: business?.name ?? 'Business',
      timezone: 'Australia/Melbourne', // TODO: store timezone per business
      policy: {
        cancellationWindowHours: policy.cancellationWindowHours,
        depositRequired: policy.depositRequired,
        depositPercent: policy.depositPercent,
        minLeadTimeHours: policy.minLeadTimeHours,
      },
    },
    availableServices: services.map((s) => ({
      id: s.id,
      name: s.name,
      durationMin: s.durationMin,
      priceCents: s.price,
    })),
    conversationHistory: (history as any[]).slice(-MAX_HISTORY_MESSAGES),
    currentMessage: message,
  };

  const startMs = Date.now();
  let aiResponse: ModelOutput = FALLBACK_REPLY;
  let success = false;
  let errorMsg: string | undefined;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    const completion = await openai.chat.completions.create(
      {
        model: AI_MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt(input) },
          ...input.conversationHistory,
          { role: 'user', content: message },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 500,
      },
      { signal: controller.signal as any }
    );
    clearTimeout(timeout);

    const rawContent = completion.choices[0].message.content ?? '{}';
    try {
      aiResponse = JSON.parse(rawContent) as ModelOutput;
      success = true;
    } catch {
      console.error('[AI] Invalid JSON response:', rawContent.slice(0, 200));
      errorMsg = 'Invalid JSON from model';
    }

    // Server-side availability check for BOOKING_ASSISTANT
    if (
      success &&
      aiResponse.intent === 'BOOKING_REQUEST' &&
      aiResponse.bookingDetails?.suggestedDate &&
      aiResponse.bookingDetails?.suggestedTime
    ) {
      const { suggestedDate, suggestedTime } = aiResponse.bookingDetails;
      const requestedTime = new Date(`${suggestedDate}T${suggestedTime}:00.000Z`);
      const isOpen = await availabilityManager.isBusinessOpen(businessId, requestedTime);
      if (!isOpen) {
        aiResponse.bookingDetails = null;
        aiResponse.replyToUser = `I checked, but ${business?.name ?? 'the business'} is closed at that time. Try a different date or time?`;
        aiResponse.suggestedActions = [{ type: 'VIEW_SERVICES', label: 'See Available Times' }];
      } else {
        aiResponse.suggestedActions = [
          { type: 'CONFIRM_BOOKING', label: 'Confirm Booking', payload: aiResponse.bookingDetails },
        ];
      }
    }

    // Log token usage
    await prisma.auditLog.create({
      data: {
        action: 'AI_REQUEST',
        entityId: businessId,
        actorId: userId,
        details: {
          agentType,
          model: AI_MODEL,
          promptTokens: completion.usage?.prompt_tokens ?? 0,
          completionTokens: completion.usage?.completion_tokens ?? 0,
          totalTokens: completion.usage?.total_tokens ?? 0,
          latencyMs: Date.now() - startMs,
          intent: aiResponse.intent,
          success,
        },
      },
    });
  } catch (err: any) {
    errorMsg = err?.message ?? String(err);
    console.error('[AI] Request failed:', errorMsg);

    await prisma.auditLog.create({
      data: {
        action: 'AI_REQUEST',
        entityId: businessId,
        actorId: userId,
        details: { agentType, model: AI_MODEL, success: false, error: errorMsg, latencyMs: Date.now() - startMs },
      },
    });
  }

  return res.status(200).json(aiResponse);
}
