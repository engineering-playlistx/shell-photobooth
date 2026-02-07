INSERT INTO storage.buckets
  (id, name)
VALUES
  ('photobooth-bucket', 'photobooth-bucket');

CREATE POLICY "Give anon users access to public folder"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'photobooth-bucket'
    AND LOWER((storage.foldername(name))[1]) = 'public'
    AND auth.role() = 'anon');

CREATE POLICY "Give anon users access to upload to public folder"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'photobooth-bucket'
    AND LOWER((storage.foldername(name))[1]) = 'public'
    AND auth.role() = 'anon');
