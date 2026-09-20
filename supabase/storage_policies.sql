-- Cấp quyền cho user ẩn danh (anon) có thể Upload file vào bucket 'projects'
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'projects');

-- Cấp quyền cho user ẩn danh (anon) có thể Đọc file từ bucket 'projects'
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'projects');

-- Cấp quyền Update (để ghi đè file nếu cần)
CREATE POLICY "Allow public update" ON storage.objects
FOR UPDATE TO public
USING (bucket_id = 'projects');
