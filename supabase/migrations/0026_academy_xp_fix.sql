-- ZOE Star Agency · Academy-XP-Fix
-- Repariert View academy_creator_xp: Quiz aus academy_quiz_attempts
-- statt aus leerer academy_progress.status='quiz_passed'.
--
-- Bestanden-Logik:
--   * max_score > 0 (Division-Schutz)
--   * UND (score = max_score   ODER   score/max_score >= 0.8)
--   * Pro (profile_id, quiz_slug) zaehlt nur 1× — der beste Versuch.
--
-- XP-Formel bleibt:
--   1 Lesson  =   5 XP
--   1 Quiz    =  25 XP
--   1 Win     = 100 XP

drop view if exists academy_creator_xp;
create view academy_creator_xp as
  select
    p.id as profile_id,
    p.display_name,
    p.tiktok_username,
    p.avatar_url,
    coalesce(reads.cnt, 0) as lessons_read,
    coalesce(quizzes.cnt, 0) as quizzes_passed,
    coalesce(challenges.cnt, 0) as challenges_won,
    (coalesce(reads.cnt, 0) * 5
     + coalesce(quizzes.cnt, 0) * 25
     + coalesce(challenges.cnt, 0) * 100) as xp_total
  from profiles p
  left join (
    select profile_id, count(*)::int as cnt
    from academy_lesson_reads
    group by profile_id
  ) reads on reads.profile_id = p.id
  left join (
    -- Distinct quiz_slug · best-attempt-passed:
    -- existiert ein Versuch mit (score=max_score OR ratio>=0.8) und max_score>0
    select profile_id, count(distinct quiz_slug)::int as cnt
    from academy_quiz_attempts
    where max_score > 0
      and (
        score >= max_score
        or (score::numeric / max_score::numeric) >= 0.8
      )
    group by profile_id
  ) quizzes on quizzes.profile_id = p.id
  left join (
    select profile_id, count(*)::int as cnt
    from academy_challenge_submissions
    where status = 'winner'
    group by profile_id
  ) challenges on challenges.profile_id = p.id
  where p.role = 'creator' and p.status = 'active';

notify pgrst, 'reload schema';
