import {
  pgTable,
  serial,
  bigserial,
  varchar,
  boolean,
  timestamp,
  integer,
  bigint,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// =============================================
// TABEL USERS (Satpam & Admin)
// =============================================
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  nama_lengkap: varchar('nama_lengkap', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('satpam'),
  created_at: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// =============================================
// TABEL MASTER EKSPEDISI
// =============================================
export const master_ekspedisi = pgTable('master_ekspedisi', {
  id: serial('id').primaryKey(),
  nama_ekspedisi: varchar('nama_ekspedisi', { length: 50 }).notNull(),
  is_active: boolean('is_active').notNull().default(true),
});

// =============================================
// TABEL MASTER PLATFORM
// =============================================
export const master_platform = pgTable('master_platform', {
  id: serial('id').primaryKey(),
  nama_platform: varchar('nama_platform', { length: 50 }).notNull(),
  is_active: boolean('is_active').notNull().default(true),
});

// =============================================
// TABEL PAKET MASUK
// =============================================
export const paket_masuk = pgTable('paket_masuk', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  waktu_diterima: timestamp('waktu_diterima').notNull().default(sql`CURRENT_TIMESTAMP`),
  foto_paket_url: varchar('foto_paket_url', { length: 255 }).notNull(),
  ekspedisi_id: integer('ekspedisi_id').references(() => master_ekspedisi.id, { onDelete: 'set null' }),
  platform_id: integer('platform_id').references(() => master_platform.id, { onDelete: 'set null' }),
  nip_pegawai: varchar('nip_pegawai', { length: 25 }).notNull(),
  petugas_id: integer('petugas_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  status: varchar('status', { length: 30 }).notNull().default('menunggu_diambil'),
  waktu_diambil: timestamp('waktu_diambil'),
  diambil_oleh: varchar('diambil_oleh', { length: 100 }),
});

// =============================================
// EXPORT TYPE INFERENCE
// =============================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Ekspedisi = typeof master_ekspedisi.$inferSelect;
export type NewEkspedisi = typeof master_ekspedisi.$inferInsert;
export type Platform = typeof master_platform.$inferSelect;
export type NewPlatform = typeof master_platform.$inferInsert;
export type PaketMasuk = typeof paket_masuk.$inferSelect;
export type NewPaketMasuk = typeof paket_masuk.$inferInsert;
