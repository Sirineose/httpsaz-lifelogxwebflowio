-- Create documents bucket for large PDF storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to documents bucket
CREATE POLICY "Users can upload documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to read their own documents
CREATE POLICY "Users can read documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- Allow service role to delete documents (for cleanup)
CREATE POLICY "Service role can delete documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'documents');