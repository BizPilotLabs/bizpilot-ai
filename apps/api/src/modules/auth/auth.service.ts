import bcrypt from "bcrypt";
import crypto from "node:crypto";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

import { config } from "../../config/index.js";
import { AppError } from "../../core/errors/index.js";
import { authRepository } from "./auth.repository.js";
import type {
  AuthContext,
  AuthenticatedPermission,
  AuthenticatedPrincipal,
  AuthenticatedRole,
  AuthResult,
  JwtAccessPayload,
  LoginInput,
  RefreshResult,
  RegisterInput,
  RequestMetadata,
  UserWithAuthRelations,
} from "./auth.types.js";

const passwordHashRounds = 12;
const millisecondsPerDay = 24 * 60 * 60 * 1000;

const authenticationError = new AppError({
  statusCode: 401,
  message: "Invalid email or password.",
  code: "AUTH_INVALID_CREDENTIALS",
});

const createExpiryDate = (days: number): Date => new Date(Date.now() + days * millisecondsPerDay);

const normalizePrincipal = (user: UserWithAuthRelations): AuthenticatedPrincipal => {
  const roles: AuthenticatedRole[] = user.roles
    .filter(({ role }) => role.deletedAt === null)
    .map(({ role }) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
    }));

  const permissionMap = new Map<string, AuthenticatedPermission>();

  for (const { role } of user.roles) {
    if (role.deletedAt !== null) {
      continue;
    }

    for (const { permission } of role.permissions) {
      if (permission.deletedAt !== null) {
        continue;
      }

      permissionMap.set(permission.id, {
        id: permission.id,
        key: permission.key,
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
      });
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      phone: user.phone,
      status: user.status,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      organizationId: user.organizationId,
    },
    organization: {
      id: user.organization.id,
      name: user.organization.name,
      slug: user.organization.slug,
      logo: user.organization.logo,
      timezone: user.organization.timezone,
      country: user.organization.country,
      currency: user.organization.currency,
      plan: user.organization.plan,
    },
    roles,
    permissions: [...permissionMap.values()].sort((left, right) => left.key.localeCompare(right.key)),
  };
};

const assertUserCanAuthenticate = (user: UserWithAuthRelations): void => {
  if (user.deletedAt !== null || user.organization.deletedAt !== null) {
    throw authenticationError;
  }

  if (user.status !== "ACTIVE") {
    throw new AppError({
      statusCode: 403,
      message: "Account is not active.",
      code: "AUTH_ACCOUNT_INACTIVE",
    });
  }

  if (user.lockedUntil !== null && user.lockedUntil.getTime() > Date.now()) {
    throw new AppError({
      statusCode: 423,
      message: "Account is temporarily locked.",
      code: "AUTH_ACCOUNT_LOCKED",
    });
  }
};

const createRawRefreshToken = (): string => crypto.randomBytes(64).toString("base64url");

const hashToken = (token: string): string => crypto.createHash("sha256").update(token).digest("hex");

const createTokenFamilyId = (): string => crypto.randomUUID();

const signAccessToken = (user: UserWithAuthRelations, sessionId: string): string => {
  const roles = user.roles.filter(({ role }) => role.deletedAt === null).map(({ role }) => role.name);
  const payload: JwtAccessPayload = {
    sub: user.id,
    organizationId: user.organizationId,
    sessionId,
    email: user.email,
    roles,
    tokenVersion: user.tokenVersion,
  };

  const accessTokenExpiresIn = config.jwtAccessTokenExpiresIn as NonNullable<SignOptions["expiresIn"]>;
  const options: SignOptions = {
    expiresIn: accessTokenExpiresIn,
    issuer: config.jwtIssuer,
    audience: config.jwtAudience,
  };

  return jwt.sign(payload, config.jwtSecret, options);
};

const decodeAccessToken = (token: string): AuthContext => {
  const decoded = jwt.verify(token, config.jwtSecret, {
    issuer: config.jwtIssuer,
    audience: config.jwtAudience,
  });

  if (typeof decoded === "string") {
    throw new AppError({ statusCode: 401, message: "Invalid access token.", code: "AUTH_TOKEN_INVALID" });
  }

  const payload = decoded as JwtPayload;
  const subject = payload.sub;
  const organizationId = payload.organizationId;
  const sessionId = payload.sessionId;
  const tokenVersion = payload.tokenVersion;

  if (typeof subject !== "string" || typeof organizationId !== "string" || typeof sessionId !== "string" || typeof tokenVersion !== "number") {
    throw new AppError({ statusCode: 401, message: "Invalid access token.", code: "AUTH_TOKEN_INVALID" });
  }

  return {
    userId: subject,
    organizationId,
    sessionId,
    tokenVersion,
  };
};

export class AuthService {
  public async register(input: RegisterInput, metadata: RequestMetadata): Promise<AuthResult> {
    const passwordHash = await bcrypt.hash(input.password, passwordHashRounds);
    const refreshToken = createRawRefreshToken();
    const refreshTokenExpiresAt = createExpiryDate(config.refreshTokenExpiresInDays);
    const sessionExpiresAt = createExpiryDate(config.sessionExpiresInDays);

    try {
      const result = await authRepository.createOwnerRegistration({
        organizationName: input.organizationName,
        organizationSlug: input.organizationSlug,
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        timezone: input.timezone ?? "UTC",
        country: input.country,
        currency: input.currency ?? "USD",
        metadata,
        sessionExpiresAt,
        refreshTokenHash: hashToken(refreshToken),
        refreshTokenFamilyId: createTokenFamilyId(),
        refreshTokenExpiresAt,
      });

      return {
        ...normalizePrincipal(result.user),
        accessToken: signAccessToken(result.user, result.session.id),
        refreshToken,
        refreshTokenExpiresAt,
      };
    } catch (error) {
      if (error instanceof Error && error.message === "REGISTRATION_CONFLICT") {
        throw new AppError({
          statusCode: 409,
          message: "Registration details conflict with an existing account or organization.",
          code: "AUTH_REGISTRATION_CONFLICT",
        });
      }

      throw error;
    }
  }

  public async login(input: LoginInput, metadata: RequestMetadata): Promise<AuthResult> {
    const user = await authRepository.findUserByEmail(input.email);

    if (user === null) {
      throw authenticationError;
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
      await authRepository.recordFailedLogin({ user, email: input.email, metadata });
      throw authenticationError;
    }

    assertUserCanAuthenticate(user);

    const refreshToken = createRawRefreshToken();
    const refreshTokenExpiresAt = createExpiryDate(config.refreshTokenExpiresInDays);
    const sessionExpiresAt = createExpiryDate(config.sessionExpiresInDays);

    const result = await authRepository.createLoginSession({
      user,
      metadata,
      sessionExpiresAt,
      refreshTokenHash: hashToken(refreshToken),
      refreshTokenFamilyId: createTokenFamilyId(),
      refreshTokenExpiresAt,
    });

    return {
      ...normalizePrincipal(result.user),
      accessToken: signAccessToken(result.user, result.session.id),
      refreshToken,
      refreshTokenExpiresAt,
    };
  }

  public async logout(refreshToken: string | undefined, metadata: RequestMetadata): Promise<void> {
    if (refreshToken === undefined || refreshToken.length === 0) {
      return;
    }

    await authRepository.revokeRefreshToken({ tokenHash: hashToken(refreshToken), metadata });
  }

  public async refresh(refreshToken: string | undefined, metadata: RequestMetadata): Promise<RefreshResult> {
    if (refreshToken === undefined || refreshToken.length === 0) {
      throw new AppError({ statusCode: 401, message: "Refresh token is required.", code: "AUTH_REFRESH_TOKEN_REQUIRED" });
    }

    const tokenHash = hashToken(refreshToken);
    const existingToken = await authRepository.findActiveRefreshToken(tokenHash);

    if (existingToken === null) {
      throw new AppError({ statusCode: 401, message: "Invalid refresh token.", code: "AUTH_REFRESH_TOKEN_INVALID" });
    }

    if (existingToken.revokedAt !== null || existingToken.rotatedAt !== null) {
      await authRepository.markRefreshTokenReuse({ refreshToken: existingToken, metadata });
      throw new AppError({ statusCode: 401, message: "Invalid refresh token.", code: "AUTH_REFRESH_TOKEN_REUSED" });
    }

    if (existingToken.expiresAt.getTime() <= Date.now()) {
      throw new AppError({ statusCode: 401, message: "Refresh token expired.", code: "AUTH_REFRESH_TOKEN_EXPIRED" });
    }

    if (existingToken.session === null || existingToken.session.revokedAt !== null || existingToken.session.expiresAt.getTime() <= Date.now()) {
      throw new AppError({ statusCode: 401, message: "Session is no longer active.", code: "AUTH_SESSION_INVALID" });
    }

    assertUserCanAuthenticate(existingToken.user);

    const newRefreshToken = createRawRefreshToken();
    const newRefreshTokenExpiresAt = createExpiryDate(config.refreshTokenExpiresInDays);
    const result = await authRepository.rotateRefreshToken({
      currentToken: existingToken,
      newTokenHash: hashToken(newRefreshToken),
      newRefreshTokenExpiresAt,
      metadata,
    });

    return {
      accessToken: signAccessToken(result.user, existingToken.session.id),
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt: result.refreshToken.expiresAt,
    };
  }

  public verifyAccessToken(accessToken: string): AuthContext {
    try {
      return decodeAccessToken(accessToken);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError({ statusCode: 401, message: "Access token expired.", code: "AUTH_TOKEN_EXPIRED" });
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError({ statusCode: 401, message: "Invalid access token.", code: "AUTH_TOKEN_INVALID" });
    }
  }

  public async me(context: AuthContext): Promise<AuthenticatedPrincipal> {
    const user = await authRepository.findUserById(context.userId);

    if (user === null || user.organizationId !== context.organizationId || user.tokenVersion !== context.tokenVersion) {
      throw new AppError({ statusCode: 401, message: "Invalid authentication context.", code: "AUTH_CONTEXT_INVALID" });
    }

    assertUserCanAuthenticate(user);

    return normalizePrincipal(user);
  }
}

export const authService = new AuthService();