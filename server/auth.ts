import type { RequestHandler, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const isAuthenticated: RequestHandler = async (req: any, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return res.status(401).json({ message: "Unauthorized" });

    req.user = { id: user.id, email: user.email, meta: user.user_metadata };
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
