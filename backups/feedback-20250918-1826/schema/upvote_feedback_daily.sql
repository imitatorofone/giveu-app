CREATE OR REPLACE FUNCTION public.upvote_feedback_daily(p_feedback_id uuid)
 RETURNS TABLE(did_upvote boolean, votes_count integer, voted_feedback_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_today date := (now() at time zone 'America/Chicago')::date;
  v_rows int := 0;
  v_uid uuid;
begin
  -- Require authentication (prevents SQL editor from creating NULL-user votes)
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Try insert; unique index (user_id, vote_day) enforces 1/day
  insert into public.feedback_votes (feedback_id, user_id, created_at)
  values (p_feedback_id, v_uid, now())
  on conflict (user_id, vote_day) do nothing;

  get diagnostics v_rows = row_count;
  did_upvote := (v_rows > 0);

  -- Which item is recorded for today (either just inserted or existing)
  select fv.feedback_id
  into voted_feedback_id
  from public.feedback_votes fv
  where fv.user_id = v_uid
    and fv.vote_day = v_today
  limit 1;

  -- Current count for the attempted item
  select coalesce(count(id),0)::int
  into votes_count
  from public.feedback_votes
  where feedback_id = p_feedback_id;

  return query select did_upvote, votes_count, voted_feedback_id;
end $function$

