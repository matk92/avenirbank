/**
 * Common Response Types - Interface Layer
 * Centralized response type definitions to eliminate duplication
 */

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface RegisterResponse {
  message: string;
  user: UserResponse;
}

export interface LoginResponse {
  access_token: string;
  role: string;
  user: UserResponse;
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;
