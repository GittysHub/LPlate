import { createSupabaseBrowser } from '@/lib/supabase-browser';

const supabase = createSupabaseBrowser();

export interface InstructorProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

export interface InstructorQueryResult {
  instructors: InstructorProfile[];
  requestedIds: string[];
  missingIds: string[];
}

/**
 * Fetch instructor profiles by IDs with missing ID detection
 * Uses normalized ID matching to handle any formatting issues
 */
export async function fetchInstructorsByIds(ids: string[]): Promise<InstructorQueryResult> {
  if (!ids.length) {
    return { instructors: [], requestedIds: [], missingIds: [] };
  }

  // Normalize incoming IDs
  const normalizeId = (id: string) => id.trim().toLowerCase();
  const normalizedIds = ids.map(normalizeId);
  const uniqueNormalizedIds = [...new Set(normalizedIds)];


  // Query with normalized matching
  const { data: instructorData, error } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, phone')
    .in('id', uniqueNormalizedIds);

  if (error) {
    console.error('Instructor query error:', error);
    throw error;
  }


  // Create lookup map with normalized keys
  const instructorsById = new Map<string, InstructorProfile>();
  (instructorData || []).forEach((instructor: InstructorProfile) => {
    const normalizedId = normalizeId(instructor.id);
    instructorsById.set(normalizedId, instructor);
  });

  // Find missing IDs
  const foundIds = Array.from(instructorsById.keys());
  const missingIds = uniqueNormalizedIds.filter(id => !instructorsById.has(id));


  return {
    instructors: Array.from(instructorsById.values()),
    requestedIds: uniqueNormalizedIds,
    missingIds
  };
}

/**
 * Test function to verify instructor fetching works correctly
 */
export async function testInstructorFetching(): Promise<InstructorQueryResult> {
  
  // Test with known IDs (John Smith should exist)
  const testIds = [
    '2692693a-1f7d-4c41-aff5-d247ddbab0ad', // John Smith (should exist)
    '38cbbea6-0254-4a1f-a27e-14d230a5e1ce'  // Lewis Test (may not exist)
  ];
  
  const result = await fetchInstructorsByIds(testIds);
  
  console.log('Test result:', result);
  
  if (result.missingIds.length > 0) {
    console.warn(`⚠️ Missing instructors: ${result.missingIds.join(', ')}`);
  } else {
  }
  
  return result;
}
