import type {
  ApiSuccessResponse,
  AuthPrincipal,
  AuthResult,
  ForgotPasswordInput,
  LoginCredentials,
  RefreshResponse,
  RegisterOrganizationInput,
  ResetPasswordInput
} from "../types";
import { httpClient } from "@/services/http-client";

const unsupportedPasswordRecoveryMessage = "Password recovery is not available yet because the backend does not expose this endpoint.";

const unwrap = <TData>(response: { data: ApiSuccessResponse<TData> }): TData => response.data.data;

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    return unwrap(await httpClient.post<ApiSuccessResponse<AuthResult>>("/auth/login", credentials));
  },

  async register(input: RegisterOrganizationInput): Promise<AuthResult> {
    return unwrap(await httpClient.post<ApiSuccessResponse<AuthResult>>("/auth/register", input));
  },

  async logout(): Promise<void> {
    await httpClient.post<ApiSuccessResponse<{ loggedOut: boolean }>>("/auth/logout");
  },

  async refresh(): Promise<RefreshResponse> {
    return unwrap(await httpClient.post<ApiSuccessResponse<RefreshResponse>>("/auth/refresh"));
  },

  async me(): Promise<AuthPrincipal> {
    return unwrap(await httpClient.get<ApiSuccessResponse<AuthPrincipal>>("/auth/me"));
  },

  async forgotPassword(_input: ForgotPasswordInput): Promise<never> {
    throw new Error(unsupportedPasswordRecoveryMessage);
  },

  async resetPassword(_input: ResetPasswordInput): Promise<never> {
    throw new Error(unsupportedPasswordRecoveryMessage);
  }
};

