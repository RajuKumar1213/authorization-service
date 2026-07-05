import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: text('password_hash'),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isSuspended: boolean('is_suspended').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }),
  isPhoneVerified: boolean('is_phone_verified').default(false).notNull(),
  timezone: varchar('timezone', { length: 50 }),
  locale: varchar('locale', { length: 20 }),
  bio: text('bio'),
});
