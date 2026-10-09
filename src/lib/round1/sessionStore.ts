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

/**
 * Gets a user's session for a round (tries Supabase first, falls back to local file).
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

    if (error && error.code !== "PGRST205" && error.code !== "PGRST116") {
      console.warn("[getQuizSession supabase warning]", error.message);
    }
  } catch (err: any) {
    console.warn("[getQuizSession db caught]", err?.message);
  }

  // Fallback to local file store
  const sessions = readJsonFile<QuizSessionData>(SESSIONS_FILE);
  const key = `${userId}:${roundSlug}`;
  return sessions[key] || null;
}

/**
 * Retrieves all quiz sessions for a round.
 */
export async function getAllQuizSessions(
  roundSlug: string = "round-1",
): Promise<QuizSessionData[]> {
  const adminDb = getAdminClient();

  try {
    const { data, error } = await adminDb
      .from("quiz_sessions")
      .select("*")
      .eq("round_slug", roundSlug);

    if (!error && data) {
      return data as QuizSessionData[];
    }
  } catch {}

  // Fallback to local file store
  const sessions = readJsonFile<QuizSessionData>(SESSIONS_FILE);
  return Object.values(sessions).filter((s) => s.round_slug === roundSlug);
}

/**
 * Creates or initializes a new quiz session.
 */
export async function createQuizSession(
  session: QuizSessionData,
): Promise<QuizSessionData> {
  const adminDb = getAdminClient();

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

    if (error) {
      console.warn(
        "[createQuizSession Supabase fallback trigger]",
        error.message,
      );
    }
  } catch (err: any) {
    console.warn("[createQuizSession db caught]", err?.message);
  }

  // Fallback save to local store
  const sessions = readJsonFile<QuizSessionData>(SESSIONS_FILE);
  const key = `${session.user_id}:${session.round_slug}`;
  sessions[key] = session;
  writeJsonFile(SESSIONS_FILE, sessions);
  return session;
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
  return null;
}

/**
 * Saves a single question response.
 */
export async function saveQuizResponse(
  sessionId: string,
  userId: string,
  questionId: string,
  selectedAnswers: any,
  isFlagged: boolean = false,
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
    is_flagged: isFlagged,
    updated_at: now,
  };
  writeJsonFile(RESPONSES_FILE, responses);
  return true;
}

/**
 * Retrieves all saved responses for a session.
 */
export async function getQuizResponses(sessionId: string): Promise<{
  savedResponses: Record<string, any>;
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
      const flaggedQuestions: string[] = [];
      data.forEach((r) => {
        savedResponses[r.question_id] = r.selected_answers;
        if (r.is_flagged) flaggedQuestions.push(r.question_id);
      });
      return { savedResponses, flaggedQuestions };
    }
  } catch {}

  // Fallback read from local store
  const responses = readJsonFile<QuizResponseData>(RESPONSES_FILE);
  const savedResponses: Record<string, any> = {};
  const flaggedQuestions: string[] = [];

  Object.values(responses).forEach((r) => {
    if (r.session_id === sessionId) {
      savedResponses[r.question_id] = r.selected_answers;
      if (r.is_flagged) flaggedQuestions.push(r.question_id);
    }
  });

  return { savedResponses, flaggedQuestions };
}
