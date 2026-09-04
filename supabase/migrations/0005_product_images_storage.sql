-- Storage for product photography.
--
-- Until now every product image was a generated SVG in public/placeholders,
-- committed to the repo. Real photographs cannot live there: they are large,
-- they change without a deploy, and Section 19 puts them outside the codebase
-- entirely. This is the bucket they go in.
--
-- PUBLIC READ, ADMIN WRITE. The bucket is public because a product photo is
-- the most public thing a shop owns — it is rendered on the storefront to
-- anonymous visitors, and putting it behind signed URLs would mean minting one
-- per image per page load for no benefit.
--
-- Writing is another matter. The policies below reuse the `admins` table from
-- 0004, so exactly the same people who can change an order's status can add or
-- remove a photograph, and a signed-in customer can do neither. Uploads go
-- straight from the browser to Storage rather than through our server: a
-- serverless function has a request-body limit well under the size of a
-- photograph, and proxying megabytes through it to re-check something RLS can
-- enforce would be slower and no safer.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Anyone may look. This is what makes the <img> on a product page work.
create policy "product images are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');

create policy "admins upload product images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from admins where admins.user_id = auth.uid())
  );

create policy "admins replace product images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and exists (select 1 from admins where admins.user_id = auth.uid())
  );

create policy "admins delete product images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and exists (select 1 from admins where admins.user_id = auth.uid())
  );
