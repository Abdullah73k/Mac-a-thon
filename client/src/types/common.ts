/**
 * Shared types used across the application.
 */

/** Generic API list response wrapper. */
export interface ListResponse<T> {
  items: T[];
  count: number;
}

/** Generic API success response. */
export interface SuccessResponse {
  success: true;
  message: string;
}

/** LLM model option for the selector. */
export interface LLMModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
}
