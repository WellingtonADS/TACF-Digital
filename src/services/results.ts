import supabase from "@/services/supabase";
import { normalizeResultSummary, type ResultSummary } from "@/utils/results";

type RawLocation = {
  name?: string | null;
  address?: string | null;
};

type RawSession = {
  date?: string | null;
  period?: string | null;
  location?: RawLocation | RawLocation[] | null;
};

type RawResultRow = {
  id: string;
  user_id: string;
  status?: string | null;
  test_date?: string | null;
  order_number?: string | null;
  attendance_confirmed?: boolean | null;
  score?: string | null;
  result_details?: unknown;
  created_at?: string | null;
  session?: RawSession | RawSession[] | null;
};

export async function fetchResultById(
  resultId: string,
): Promise<ResultSummary | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return null;
  }

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, user_id, status, test_date, order_number, attendance_confirmed, score, result_details, created_at, session:sessions(date, period, location:locations(name, address))",
    )
    .eq("id", resultId)
    .eq("user_id", user.id)
    .maybeSingle<RawResultRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const sessionRaw = Array.isArray(data.session)
    ? data.session[0]
    : data.session;
  const locationRaw = Array.isArray(sessionRaw?.location)
    ? sessionRaw.location[0]
    : sessionRaw?.location;

  return normalizeResultSummary({
    id: data.id,
    status: data.status ?? null,
    test_date: data.test_date ?? sessionRaw?.date ?? null,
    order_number: data.order_number ?? null,
    attendance_confirmed: data.attendance_confirmed ?? null,
    score: data.score ?? null,
    result_details: data.result_details,
    created_at: data.created_at ?? null,
    session_period: sessionRaw?.period ?? null,
    location: locationRaw?.name ?? null,
    location_address: locationRaw?.address ?? null,
  });
}
