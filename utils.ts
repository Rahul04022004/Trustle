/**
 * Parses an error object to return a user-friendly message.
 * Specifically handles structured API errors from Google Gemini.
 * @param error The unknown error caught in a try-catch block.
 * @returns A string containing a readable error message.
 */
export const getFriendlyErrorMessage = (error: unknown): string => {
  // Most common case: the error is an Error instance.
  if (error instanceof Error) {
    try {
      // The Gemini API often returns errors as a JSON string in the error's message property.
      const errorData = JSON.parse(error.message);
      const apiError = errorData.error;

      // Check for specific rate limit / quota exceeded error.
      if (apiError && (apiError.code === 429 || apiError.status === 'RESOURCE_EXHAUSTED')) {
        return "API quota exceeded. Please check your Google AI Studio plan and billing details. You may need to use a different API key by updating your environment variables.";
      }
      
      // Return the message from a structured API error.
      if (apiError && apiError.message) {
        return `API Error: ${apiError.message}`;
      }
    } catch (e) {
      // If parsing fails, it's not a JSON error message. Fall through to return the original message.
    }
    return error.message;
  }
  
  // Handle case where a string was thrown.
  if (typeof error === 'string') {
    return error;
  }

  // Fallback for other types of errors.
  return "An unknown error occurred. Please check the console for more details.";
};
