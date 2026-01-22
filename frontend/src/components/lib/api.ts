// lib/api.ts
import { API_URL } from '../../api'

export async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string; message?: string }> {
  const token = localStorage.getItem('token');
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
    });

    // Get response as text first
    const responseText = await response.text();
    let responseData;
    
    // Parse JSON if response exists
    if (responseText && responseText.trim().length > 0) {
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('JSON parse error:', e, 'Response text:', responseText);
        return { 
          error: `Server returned invalid JSON (status: ${response.status})` 
        };
      }
    }

    // Handle non-OK responses
    if (!response.ok) {
      return { 
        error: responseData?.error || responseData?.message || 
               `Request failed with status ${response.status}` 
      };
    }

    // Return successful response
    return { data: responseData as T };
    
  } catch (error) {
    console.error('API request error:', error);
    return { 
      error: error instanceof Error ? error.message : 'Network error. Please try again.' 
    };
  }
}