-- MyWealth — allow editing an asset account's name/category
-- (needed for the Edit button in the Asset page's Update tab).
-- Jalankan sekali di Supabase SQL Editor.

create policy "update own asset accounts" on asset_accounts for update using (family_id = current_family_id()) with check (family_id = current_family_id());
