export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  phone: string | null;
  status: string;
  emailVerified: boolean;
  lastLoginAt: string | null;
  organizationId: string;
}

export interface AuthOrganization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  timezone: string;
  country: string | null;
  currency: string;
  plan: string;
}

export interface AuthRole {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface AuthPermission {
  id: string;
  key: string;
  name: string;
  resource: string;
  action: string;
}

export interface AuthPrincipal {
  user: AuthUser;
  organization: AuthOrganization;
  roles: AuthRole[];
  permissions: AuthPermission[];
}

export interface AuthResult extends AuthPrincipal {
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterOrganizationInput {
  organizationName: string;
  organizationSlug: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  timezone?: string;
  country?: string;
  currency?: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

