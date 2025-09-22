create or replace view public.feedback_items_with_votes as  SELECT fi.id,
    fi.user_id,
    fi.email,
    fi.title,
    fi.details,
    fi.category,
    fi.created_at,
    COALESCE(count(v.id), 0::bigint)::integer AS votes_count
   FROM feedback_items fi
     LEFT JOIN feedback_votes v ON v.feedback_id = fi.id
  GROUP BY fi.id;;
