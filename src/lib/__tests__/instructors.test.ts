// Test file for instructor fetching functionality
import { fetchInstructorsByIds } from '@/lib/instructors';

/**
 * Test that requests two known IDs and asserts missingIds is empty
 */
export async function runInstructorTests() {
  console.log('🧪 Running instructor fetching tests...');
  
  try {
    // Test with known IDs
    const testIds = [
      '2692693a-1f7d-4c41-aff5-d247ddbab0ad', // John Smith (should exist)
      '38cbbea6-0254-4a1f-a27e-14d230a5e1ce'  // Lewis Test (should exist after seed)
    ];
    
    const result = await fetchInstructorsByIds(testIds);
    
    // Assertions
    console.log('Test result:', result);
    
    if (result.missingIds.length > 0) {
      throw new Error(`❌ Test FAILED: Missing instructors for IDs: ${result.missingIds.join(', ')}`);
    }
    
    if (result.instructors.length !== testIds.length) {
      throw new Error(`❌ Test FAILED: Expected ${testIds.length} instructors, got ${result.instructors.length}`);
    }
    
    console.log('✅ Test PASSED: All requested instructors found');
    console.log('Found instructors:', result.instructors.map(i => i.name));
    
    return result;
    
  } catch (error) {
    console.error('❌ Test FAILED:', error);
    throw error;
  }
}
