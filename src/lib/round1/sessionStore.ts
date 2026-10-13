import fs from "fs";
import path from "path";
import { getAdminClient } from "@/lib/supabase/admin";

export interface QuizSessionData {
  id: string;
  user_id: string;
  round_slug: string;
  started_at: string;
  expires_at: string;
  submitted_at: string | null;
  status: "in_progress" | "submitted" | "terminated";
  termination_reason: string | null;
  strike_count: number;
  shuffled_order: string[];
  shuffled_options?: Record<string, string[]>;
  question_times?: Record<string, number>;
  total_time_seconds?: number;
  score: number;
  max_score: number;
  created_at: string;
}

export interface QuizResponseData {
  id: string;
  session_id: string;
  user_id: string;
  question_id: string;
  selected_answers: any;
  time_spent_seconds: number;
  is_flagged: boolean;
  updated_at: string;
}

// Local filesystem fallback store
const DATA_DIR = path.resolve(process.cwd(), ".data");
const SESSIONS_FILE = path.join(DATA_DIR, "quiz_sessions.json");
const RESPONSES_FILE = path.join(DATA_DIR, "quiz_responses.json");

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {}
}

function readJsonFile<T>(filePath: string): Record<string, T> {
  ensureDataDir();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch {}
  return {};
}

function writeJsonFile<T>(filePath: string, data: Record<string, T>) {
  ensureDataDir();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("[writeJsonFile error]", e);
  }
}

function extractSessionFromExpectations(
  text: string | null,
): QuizSessionData | null {
  if (!text || !text.includes("||R1_ATTEMPT||")) return null;
  try {
    const parts = text.split("||R1_ATTEMPT||");
    const jsonStr = parts[parts.length - 1].trim();
    return JSON.parse(jsonStr) as QuizSessionData;
  } catch {
    return null;
  }
}

function embedSessionIntoExpectations(
  origText: string | null,
  session: QuizSessionData,
): string {
  const base = (origText || "").split("||R1_ATTEMPT||")[0].trim();
  return (base ? `${base}\n` : "") + `||R1_ATTEMPT||${JSON.stringify(session)}`;
}

/**
 * Gets a user's session for a round (tries Supabase quiz_sessions, then registrations, then local file).
 */
export async function getQuizSession(
  userId: string,
  roundSlug: string = "round-1",
): Promise<QuizSessionData | null> {
  const adminDb = getAdminClient();

  try {
    const { data, error } = await adminDb
      .from("quiz_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("round_slug", roundSlug)
      .maybeSingle();

    if (!error && data) {
      return data as QuizSessionData;
    }
  } catch {}

  // Fallback 1: Query registrations in Supabase (100% persistent across Vercel serverless containers)
  try {
    const { data: reg } = await adminDb
      .from("registrations")
      .select("expectations")
      .eq("profile_id", userId)
      .maybeSingle();

    const dbSession = extractSessionFromExpectations(reg?.expectations || null);
    if (dbSession && dbSession.round_slug === roundSlug) {
      return dbSession;
    }
  } catch (err: any) {
    console.warn("[getQuizSession registrations fallback]", err?.message);
  }

  // Fallback 2: Local file store
  const sessions = readJsonFile<QuizSessionData>(SESSIONS_FILE);
  const key = `${userId}:${roundSlug}`;
  return sessions[key] || null;
}

/**
 * Retrieves all quiz sessions for a round. Strictly keeps only the first attempt per user.
 */
export async function getAllQuizSessions(
  roundSlug: string = "round-1",
): Promise<QuizSessionData[]> {
  const adminDb = getAdminClient();
  const sessionList: QuizSessionData[] = [];

  try {
    const { data, error } = await adminDb
      .from("quiz_sessions")
      .select("*")
      .eq("round_slug", roundSlug);

    if (!error && data && data.length > 0) {
      sessionList.push(...(data as QuizSessionData[]));
    }
  } catch {}

  // Also read from Supabase registrations
  try {
    const { data: regList } = await adminDb
      .from("registrations")
      .select("profile_id, expectations")
      .like("expectations", "%||R1_ATTEMPT||%");

    (regList || []).forEach((r) => {
      const s = extractSessionFromExpectations(r.expectations);
      if (s && s.round_slug === roundSlug) {
        sessionList.push(s);
      }
    });
  } catch {}

  // Fallback read from local file store
  const localSessions = readJsonFile<QuizSessionData>(SESSIONS_FILE);
  Object.values(localSessions).forEach((s) => {
    if (s.round_slug === roundSlug) {
      sessionList.push(s);
    }
  });

  // STRICT RULE: If multiple attempts exist for any user, keep ONLY the FIRST attempt!
  const byUser = new Map<string, QuizSessionData>();
  // Sort oldest first so the first attempt wins
  sessionList.sort((a, b) => {
    const timeA = new Date(a.started_at || a.created_at).getTime();
    const timeB = new Date(b.started_at || b.created_at).getTime();
    return timeA - timeB;
  });

  for (const s of sessionList) {
    if (!byUser.has(s.user_id)) {
      byUser.set(s.user_id, s);
    }
  }

  return Array.from(byUser.values());
}

/**
 * Creates or initializes a new quiz session.
 * STRICT: If a session already exists, NEVER creates a second attempt. Returns the first attempt.
 */
export async function createQuizSession(
  session: QuizSessionData,
): Promise<QuizSessionData> {
  const adminDb = getAdminClient();

  // 1. Check if user already has an existing session in registrations
  try {
    const { data: reg } = await adminDb
      .from("registrations")
      .select("id, expectations")
      .eq("profile_id", session.user_id)
      .maybeSingle();

    if (reg) {
      const existingInReg = extractSessionFromExpectations(reg.expectations);
      if (existingInReg) {
        // STRICT RULE: Lock to the first attempt forever!
        return existingInReg;
      }

      // Persist the FIRST attempt into Supabase registration
      const newExp = embedSessionIntoExpectations(reg.expectations, session);
      await adminDb
        .from("registrations")
        .update({ expectations: newExp })
        .eq("id", reg.id);
    }
  } catch (err: any) {
    console.warn("[createQuizSession registrations db]", err?.message);
  }

  try {
    const { data, error } = await adminDb
      .from("quiz_sessions")
      .insert({
        id: session.id,
        user_id: session.user_id,
        round_slug: session.round_slug,
        started_at: session.started_at,
        expires_at: session.expires_at,
        status: session.status,
        strike_count: session.strike_count,
        shuffled_order: session.shuffled_order,
        score: session.score,
        max_score: session.max_score,
      })
      .select()
      .single();

    if (!error && data) {
      return data as QuizSessionData;
    }
  } catch {}

  // Fallback save to local store
  const sessions = readJsonFile<QuizSessionData>(SESSIONS_FILE);
  const key = `${session.user_id}:${session.round_slug}`;
  if (!sessions[key]) {
    sessions[key] = session;
    writeJsonFile(SESSIONS_FILE, sessions);
  }
  return sessions[key];
}

/**
 * Updates a quiz session.
 */
export async function updateQuizSession(
  userId: string,
  roundSlug: string,
  updates: Partial<QuizSessionData>,
): Promise<QuizSessionData | null> {
  const adminDb = getAdminClient();
  let updatedData: QuizSessionData | null = null;

  // 1. Update in Supabase registrations table
  try {
    const { data: reg } = await adminDb
      .from("registrations")
      .select("id, expectations")
      .eq("profile_id", userId)
      .maybeSingle();

    if (reg) {
      const existing = extractSessionFromExpectations(reg.expectations) || {
        id: "",
        user_id: userId,
        round_slug: roundSlug,
        started_at: new Date().toISOString(),
        expires_at: new Date().toISOString(),
        submitted_at: null,
        status: "in_progress",
        termination_reason: null,
        strike_count: 0,
        shuffled_order: [],
        score: 0,
        max_score: 30,
        created_at: new Date().toISOString(),
      };

      const merged = { ...existing, ...updates };
      const newExp = embedSessionIntoExpectations(reg.expectations, merged);
      await adminDb
        .from("registrations")
        .update({ expectations: newExp })
        .eq("id", reg.id);
      updatedData = merged;
    }
  } catch (err: any) {
    console.warn("[updateQuizSession reg error]", err?.message);
  }

  try {
    const { data, error } = await adminDb
      .from("quiz_sessions")
      .update(updates)
      .eq("user_id", userId)
      .eq("round_slug", roundSlug)
      .select()
      .maybeSingle();

    if (!error && data) {
      return data as QuizSessionData;
    }
  } catch {}

  // Fallback update in local store
  const sessions = readJsonFile<QuizSessionData>(SESSIONS_FILE);
  const key = `${userId}:${roundSlug}`;
  if (sessions[key]) {
    sessions[key] = { ...sessions[key], ...updates };
    writeJsonFile(SESSIONS_FILE, sessions);
    return sessions[key];
  }
  return updatedData;
}

/**
 * Saves a single question response with time tracking.
 */
export async function saveQuizResponse(
  sessionId: string,
  userId: string,
  questionId: string,
  selectedAnswers: any,
  isFlagged: boolean = false,
  timeSpentSeconds: number = 0,
) {
  const adminDb = getAdminClient();
  const now = new Date().toISOString();

  try {
    const { error } = await adminDb.from("quiz_responses").upsert(
      {
        session_id: sessionId,
        user_id: userId,
        question_id: questionId,
        selected_answers: selectedAnswers,
        is_flagged: isFlagged,
        updated_at: now,
      },
      { onConflict: "session_id,question_id" },
    );

    if (!error) return true;
  } catch {}

  // Fallback save in local store
  const responses = readJsonFile<QuizResponseData>(RESPONSES_FILE);
  const key = `${sessionId}:${questionId}`;
  responses[key] = {
    id: key,
    session_id: sessionId,
    user_id: userId,
    question_id: questionId,
    selected_answers: selectedAnswers,
    time_spent_seconds: timeSpentSeconds,
    is_flagged: isFlagged,
    updated_at: now,
  };
  writeJsonFile(RESPONSES_FILE, responses);

  // Also update question_times in session store
  const sessions = readJsonFile<QuizSessionData>(SESSIONS_FILE);
  const sessionKey = `${userId}:round-1`;
  if (sessions[sessionKey]) {
    if (!sessions[sessionKey].question_times) {
      sessions[sessionKey].question_times = {};
    }
    sessions[sessionKey].question_times![questionId] = timeSpentSeconds;
    sessions[sessionKey].total_time_seconds = Object.values(
      sessions[sessionKey].question_times!,
    ).reduce((a, b) => a + b, 0);
    writeJsonFile(SESSIONS_FILE, sessions);
  }

  return true;
}

/**
 * Retrieves all saved responses and time spent for a session.
 */
export async function getQuizResponses(sessionId: string): Promise<{
  savedResponses: Record<string, any>;
  questionTimes: Record<string, number>;
  flaggedQuestions: string[];
}> {
  const adminDb = getAdminClient();

  try {
    const { data, error } = await adminDb
      .from("quiz_responses")
      .select("question_id, selected_answers, is_flagged")
      .eq("session_id", sessionId);

    if (!error && data && data.length > 0) {
      const savedResponses: Record<string, any> = {};
      const questionTimes: Record<string, number> = {};
      const flaggedQuestions: string[] = [];
      data.forEach((r) => {
        savedResponses[r.question_id] = r.selected_answers;
        if (r.is_flagged) flaggedQuestions.push(r.question_id);
      });
      return { savedResponses, questionTimes, flaggedQuestions };
    }
  } catch {}

  // Fallback read from local store
  const responses = readJsonFile<QuizResponseData>(RESPONSES_FILE);
  const savedResponses: Record<string, any> = {};
  const questionTimes: Record<string, number> = {};
  const flaggedQuestions: string[] = [];

  Object.values(responses).forEach((r) => {
    if (r.session_id === sessionId) {
      savedResponses[r.question_id] = r.selected_answers;
      questionTimes[r.question_id] = r.time_spent_seconds || 0;
      if (r.is_flagged) flaggedQuestions.push(r.question_id);
    }
  });

  return { savedResponses, questionTimes, flaggedQuestions };
}

/**
 * Deletes a quiz session and associated responses (used for President test resets).
 */
export async function deleteQuizSession(
  userId: string,
  roundSlug: string = "round-1",
): Promise<boolean> {
  const adminDb = getAdminClient();

  try {
    const { data: reg } = await adminDb
      .from("registrations")
      .select("id, expectations")
      .eq("profile_id", userId)
      .maybeSingle();

    if (reg?.expectations && reg.expectations.includes("||R1_ATTEMPT||")) {
      const cleaned = reg.expectations.split("||R1_ATTEMPT||")[0].trim();
      await adminDb
        .from("registrations")
        .update({ expectations: cleaned })
        .eq("id", reg.id);
    }
  } catch {}

  try {
    const existing = await getQuizSession(userId, roundSlug);
    if (existing) {
      await adminDb
        .from("quiz_responses")
        .delete()
        .eq("session_id", existing.id);
      await adminDb.from("quiz_sessions").delete().eq("id", existing.id);
    }
  } catch (err: any) {
    console.warn("[deleteQuizSession db caught]", err?.message);
  }

  // Clear from local file store
  const sessions = readJsonFile<QuizSessionData>(SESSIONS_FILE);
  const key = `${userId}:${roundSlug}`;
  const existingLocal = sessions[key];
  if (existingLocal) {
    delete sessions[key];
    writeJsonFile(SESSIONS_FILE, sessions);

    const responses = readJsonFile<QuizResponseData>(RESPONSES_FILE);
    let changed = false;
    Object.keys(responses).forEach((k) => {
      if (responses[k].session_id === existingLocal.id) {
        delete responses[k];
        changed = true;
      }
    });
    if (changed) {
      writeJsonFile(RESPONSES_FILE, responses);
    }
  }
  return true;
}
