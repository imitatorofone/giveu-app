alter table public.feedback_attachments add constraint feedback_attachments_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES feedback_items(id) ON DELETE CASCADE;
alter table public.feedback_items add constraint feedback_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.feedback_votes add constraint feedback_votes_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES feedback_items(id) ON DELETE CASCADE;
alter table public.feedback_votes add constraint feedback_votes_feedback_id_user_id_key UNIQUE (feedback_id, user_id);
alter table public.feedback_votes add constraint feedback_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.profiles add constraint profiles_org_id_fkey FOREIGN KEY (org_id) REFERENCES orgs(id);
