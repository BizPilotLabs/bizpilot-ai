import type { Request, Response } from "express";

import { config } from "../../config/index.js";
import { authService } from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.schema.js";
import type { AuthenticatedRequest, RequestMetadata } from "./auth.types.js";

interface SuccessResponse<T> {
  success: true;
  data: T;
}

const toMetadata = (request: Request): RequestMetadata => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent"),
});

const getRefreshTokenFromCookies = (request: Request): string | undefined => {
  const cookieHeader = request.get("cookie");

  if (cookieHeader === undefined) {
    return undefined;
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const prefix = `${config.refreshTokenCookieName}=`;
  const refreshCookie = cookies.find((cookie) => cookie.startsWith(prefix));

  if (refreshCookie === undefined) {
    return undefined;
  }

  return decodeURIComponent(refreshCookie.slice(prefix.length));
};

const setRefreshTokenCookie = (response: Response, token: string, expiresAt: Date): void => {
  response.cookie(config.refreshTokenCookieName, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    expires: expiresAt,
    path: "/auth",
  });
};

const clearRefreshTokenCookie = (response: Response): void => {
  response.clearCookie(config.refreshTokenCookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    path: "/auth",
  });
};

const sendSuccess = <T>(response: Response, statusCode: number, data: T): void => {
  const body: SuccessResponse<T> = {
    success: true,
    data,
  };

  response.status(statusCode).json(body);
};

export class AuthController {
  public async register(request: Request, response: Response): Promise<void> {
    const input = registerSchema.parse(request.body);
    const result = await authService.register(input, toMetadata(request));

    setRefreshTokenCookie(response, result.refreshToken, result.refreshTokenExpiresAt);

    sendSuccess(response, 201, {
      accessToken: result.accessToken,
      user: result.user,
      organization: result.organization,
      roles: result.roles,
      permissions: result.permissions,
    });
  }

  public async login(request: Request, response: Response): Promise<void> {
    const input = loginSchema.parse(request.body);
    const result = await authService.login(input, toMetadata(request));

    setRefreshTokenCookie(response, result.refreshToken, result.refreshTokenExpiresAt);

    sendSuccess(response, 200, {
      accessToken: result.accessToken,
      user: result.user,
      organization: result.organization,
      roles: result.roles,
      permissions: result.permissions,
    });
  }

  public async logout(request: Request, response: Response): Promise<void> {
    await authService.logout(getRefreshTokenFromCookies(request), toMetadata(request));
    clearRefreshTokenCookie(response);
    sendSuccess(response, 200, { loggedOut: true });
  }

  public async refresh(request: Request, response: Response): Promise<void> {
    const result = await authService.refresh(getRefreshTokenFromCookies(request), toMetadata(request));

    setRefreshTokenCookie(response, result.refreshToken, result.refreshTokenExpiresAt);

    sendSuccess(response, 200, {
      accessToken: result.accessToken,
    });
  }

  public async me(request: AuthenticatedRequest, response: Response): Promise<void> {
    const result = await authService.me(request.auth);

    sendSuccess(response, 200, {
      user: result.user,
      organization: result.organization,
      roles: result.roles,
      permissions: result.permissions,
    });
  }
}

export const authController = new AuthController();