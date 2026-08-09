-- MyWealth — allow deleting individual asset update entries
-- (needed for the new History tab). Jalankan sekali di Supabase SQL Editor.

create policy "delete own asset snapshots" on asset_snapshots for delete using (family_id = current_family_id());
