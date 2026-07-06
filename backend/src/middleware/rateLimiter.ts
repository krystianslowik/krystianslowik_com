import type { NextFunction, Request, Response } from 'express';

interface RateLimitState {
  count: number;
  windowStart: number;
  challengeActive: boolean;
  blockUntil: number;
}

interface ConversationMessage {
  role?: unknown;
  content?: unknown;
}

// State lives in memory keyed by IP and is lost on restart.
const rateLimitMap = new Map<string, RateLimitState>();

const MESSAGE_LIMIT = 20;
const WINDOW_SIZE = 60 * 1000;
const BLOCK_TIME = 5 * 60 * 1000;

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const clientIp = req.ip ?? 'unknown';
  const now = Date.now();

  let state = rateLimitMap.get(clientIp);
  if (!state) {
    state = {
      count: 0,
      windowStart: now,
      challengeActive: false,
      blockUntil: 0,
    };
    rateLimitMap.set(clientIp, state);
    console.debug(`[RATE LIMIT] Initialized state for IP ${clientIp}:`, state);
  } else {
    console.debug(`[RATE LIMIT] Current state for IP ${clientIp}:`, state);
  }

  if (state.blockUntil > now) {
    console.warn(
      `[RATE LIMIT] IP ${clientIp} is blocked until ${new Date(state.blockUntil).toLocaleTimeString()}`,
    );
    res.status(429).json({
      error: `Too many requests. You are blocked until ${new Date(state.blockUntil).toLocaleTimeString()}.`,
    });
    return;
  }

  if (now - state.windowStart > WINDOW_SIZE) {
    console.debug(`[RATE LIMIT] Resetting rate limit window for IP ${clientIp}`);
    state.count = 0;
    state.windowStart = now;
    state.challengeActive = false;
  }

  // Requires express.json() to have parsed the body already.
  let userMessage = '';
  const body = req.body as { conversation?: unknown } | undefined;
  if (body && Array.isArray(body.conversation)) {
    const conversation = body.conversation as ConversationMessage[];
    const lastUserMessage = conversation
      .slice()
      .reverse()
      .find((msg) => msg.role === 'user');
    if (lastUserMessage && typeof lastUserMessage.content === 'string') {
      userMessage = lastUserMessage.content.trim().toLowerCase();
    }
  }
  console.debug(`[RATE LIMIT] User message extracted: "${userMessage}"`);

  if (state.challengeActive) {
    console.debug(`[RATE LIMIT] Challenge active for IP ${clientIp}`);
    if (userMessage === 'no') {
      console.debug(`[RATE LIMIT] IP ${clientIp} passed the challenge. Resetting state.`);
      state.count = 0;
      state.challengeActive = false;
      state.windowStart = now;
    } else {
      console.warn(
        `[RATE LIMIT] IP ${clientIp} failed challenge response. Blocking for 5 minutes.`,
      );
      state.blockUntil = now + BLOCK_TIME;
      res.status(429).json({ error: 'Rate limit exceeded. You are blocked for 5 minutes.' });
      return;
    }
  }

  state.count++;
  console.debug(`[RATE LIMIT] Incremented count for IP ${clientIp}: ${state.count}`);

  if (state.count > MESSAGE_LIMIT) {
    state.challengeActive = true;
    console.warn(`[RATE LIMIT] IP ${clientIp} exceeded message limit. Activating challenge.`);
    res.status(429).json({ error: 'Are you bot? If no, simply reply "no".' });
    return;
  }

  next();
}
