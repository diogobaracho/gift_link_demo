/**
 * Registration, login and profile management.
 */
import { randomUUID } from 'node:crypto';

import { MongoServerError, ObjectId, type Collection } from 'mongodb';

import type { AppConfig } from '../../config/env.js';
import type { UserDocument } from '../../db/collections.js';
import { conflict, notFound, unauthorized } from '../../lib/http-error.js';
import { signToken } from '../../lib/jwt.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';

import type { LoginInput, RegisterInput, UpdateProfileInput } from './auth.schema.js';

/** User as returned by the API. The password hash never leaves this module. */
export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

const DUPLICATE_KEY = 11000;

/**
 * Hash of a random throwaway password, computed once on first use. Comparing against it
 * when the email is unknown makes a failed login take the same time whether or not the
 * account exists, which prevents user enumeration by timing.
 */
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword(randomUUID()));

export function toPublicUser(doc: UserDocument): PublicUser {
  return {
    id: doc._id.toHexString(),
    email: doc.email,
    firstName: doc.firstName,
    lastName: doc.lastName,
    createdAt: doc.createdAt,
  };
}

export class AuthService {
  constructor(
    private readonly users: Collection<UserDocument>,
    private readonly jwtConfig: AppConfig['jwt'],
  ) {}

  private issue(user: UserDocument): AuthResult {
    const token = signToken({ sub: user._id.toHexString(), email: user.email }, this.jwtConfig);
    return { token, user: toPublicUser(user) };
  }

  /** @throws {HttpError} 409 if the email is taken (enforced by the unique index). */
  async register(input: RegisterInput): Promise<AuthResult> {
    const now = new Date();
    const doc: UserDocument = {
      _id: new ObjectId(),
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash: await hashPassword(input.password),
      createdAt: now,
      updatedAt: now,
    };

    try {
      await this.users.insertOne(doc);
    } catch (err) {
      // Rely on the unique index rather than "find then insert", which has a race window.
      if (err instanceof MongoServerError && err.code === DUPLICATE_KEY) {
        throw conflict('Email is already registered');
      }
      throw err;
    }
    return this.issue(doc);
  }

  /** @throws {HttpError} 401 with the same generic message for unknown email or bad password. */
  async login({ email, password }: LoginInput): Promise<AuthResult> {
    const user = await this.users.findOne({ email });
    const valid = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));
    if (!user || !valid) throw unauthorized('Invalid email or password');
    return this.issue(user);
  }

  async getById(id: string): Promise<PublicUser> {
    const user = ObjectId.isValid(id) ? await this.users.findOne({ _id: new ObjectId(id) }) : null;
    if (!user) throw notFound('User not found');
    return toPublicUser(user);
  }

  async updateProfile(id: string, changes: UpdateProfileInput): Promise<PublicUser> {
    const user = await this.users.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...changes, updatedAt: new Date() } },
      { returnDocument: 'after' },
    );
    if (!user) throw notFound('User not found');
    return toPublicUser(user);
  }
}
