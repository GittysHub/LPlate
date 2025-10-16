"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

interface SocialProofSubmissionFormProps {
  instructorId: string;
  onSuccess?: () => void;
}

export default function SocialProofSubmissionForm({ 
  instructorId, 
  onSuccess 
}: SocialProofSubmissionFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [testDate, setTestDate] = useState("");
  const [testLocation, setTestLocation] = useState("");
  const [testimonial, setTestimonial] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const sb = createSupabaseBrowser();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Please upload a JPG, PNG, or WebP image");
        return;
      }
      
      // Validate file size (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      
      setFile(selectedFile);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !testDate || !testLocation) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Get current user
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to submit a certificate");
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await sb.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = sb.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Insert submission record
      const { error: insertError } = await (sb.from('social_proof_submissions') as any)
        .insert({
          learner_id: user.id,
          instructor_id: instructorId,
          certificate_image_url: publicUrl,
          test_date: testDate,
          test_location: testLocation,
          testimonial: testimonial || null,
          status: 'pending' as const
        });

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      if (onSuccess) onSuccess();
      
      // Reset form
      setFile(null);
      setTestDate("");
      setTestLocation("");
      setTestimonial("");
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit certificate";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="text-green-600 text-4xl mb-3">🎉</div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          Certificate Submitted!
        </h3>
        <p className="text-green-700 text-sm">
          Thank you for sharing your success! Your certificate will be reviewed and may appear on our homepage.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Share Your Success! 🏆
        </h3>
        <p className="text-gray-600 text-sm">
          Upload your driving test certificate to inspire other learners
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Certificate Photo *
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            id="certificate-upload"
          />
          <label htmlFor="certificate-upload" className="cursor-pointer">
            {file ? (
              <div className="text-green-600">
                <div className="text-2xl mb-2">📸</div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">Click to change</p>
              </div>
            ) : (
              <div className="text-gray-500">
                <div className="text-3xl mb-2">📷</div>
                <p className="text-sm font-medium">Click to upload certificate</p>
                <p className="text-xs">JPG, PNG, WebP (max 5MB)</p>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Test Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Date *
        </label>
        <input
          type="date"
          value={testDate}
          onChange={(e) => setTestDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          required
        />
      </div>

      {/* Test Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Centre Location *
        </label>
        <input
          type="text"
          value={testLocation}
          onChange={(e) => setTestLocation(e.target.value)}
          placeholder="e.g., Bristol Test Centre"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          required
        />
      </div>

      {/* Testimonial */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Testimonial (Optional)
        </label>
        <textarea
          value={testimonial}
          onChange={(e) => setTestimonial(e.target.value)}
          placeholder="Share your experience with this instructor..."
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !file || !testDate || !testLocation}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
          loading || !file || !testDate || !testLocation
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-600 text-white"
        }`}
      >
        {loading ? "Submitting..." : "Submit Certificate"}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Your certificate will be reviewed before appearing publicly
      </p>
    </form>
  );
}
