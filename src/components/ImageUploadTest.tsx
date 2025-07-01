import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from './ImageUpload';
import { useAuth } from '@/lib/AuthProvider';

export function ImageUploadTest() {
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Image Upload Test</CardTitle>
          <p className="text-sm text-muted-foreground">
            Test the new image upload functionality with Supabase Storage
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Current Status:</h3>
            <p className="text-sm text-blue-700">
              {user ? (
                <>✅ Logged in as: {user.email}</>
              ) : (
                <>❌ Please log in to test image upload</>
              )}
            </p>
          </div>

          {user && (
            <ImageUpload
              currentImage={uploadedImage}
              onImageChange={setUploadedImage}
              destination="Test Destination"
              activity="Test Activity"
            />
          )}

          {uploadedImage && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Uploaded Image URL:</h3>
              <p className="text-sm text-green-700 break-all">{uploadedImage}</p>
              <p className="text-xs text-green-600 mt-2">
                This URL should be permanent and work even after page refresh!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 