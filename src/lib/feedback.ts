// src/lib/feedback.ts
// Feedback system — stores in Supabase, optionally emails via a free webhook
import { supabase } from "./supabase";

export interface FeedbackPayload {
  userId: string | null;
  userEmail: string | null;
  type: "bug" | "suggestion" | "general";
  message: string;
}

export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  const { error } = await supabase.from("feedback").insert({
    user_id: payload.userId,
    user_email: payload.userEmail,
    type: payload.type,
    message: payload.message,
    created_at: new Date().toISOString(),
  });

  if (error) throw error;
}
