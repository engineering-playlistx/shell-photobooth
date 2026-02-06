
  create policy "Give anon users access to public folder"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'loccitane-photobooth'::text) AND (lower((storage.foldername(name))[1]) = 'public'::text) AND (auth.role() = 'anon'::text)));



  create policy "Give anon users access to upload to public folder"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'loccitane-photobooth'::text) AND (lower((storage.foldername(name))[1]) = 'public'::text) AND (auth.role() = 'anon'::text)));



