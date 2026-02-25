import { z } from 'zod';

// =============================================
// AUTH VALIDATORS
// =============================================
export const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

// =============================================
// USER VALIDATORS
// =============================================
export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  nama_lengkap: z.string().min(1).max(100),
  role: z.enum(['admin', 'satpam']).default('satpam'),
});

export const updateUserSchema = z.object({
  nama_lengkap: z.string().min(1).max(100).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'satpam']).optional(),
});

// =============================================
// EKSPEDISI VALIDATORS
// =============================================
export const createEkspedisiSchema = z.object({
  nama_ekspedisi: z.string().min(1).max(50),
  is_active: z.boolean().default(true),
});

export const updateEkspedisiSchema = z.object({
  nama_ekspedisi: z.string().min(1).max(50).optional(),
  is_active: z.boolean().optional(),
});

// =============================================
// PLATFORM VALIDATORS
// =============================================
export const createPlatformSchema = z.object({
  nama_platform: z.string().min(1).max(50),
  is_active: z.boolean().default(true),
});

export const updatePlatformSchema = z.object({
  nama_platform: z.string().min(1).max(50).optional(),
  is_active: z.boolean().optional(),
});

// =============================================
// PAKET MASUK VALIDATORS
// =============================================
export const createPaketSchema = z.object({
  foto_paket_url: z.string().min(1, 'Foto paket wajib diisi'),
  ekspedisi_id: z.number().int().positive().nullable().default(null),
  platform_id: z.number().int().positive().nullable().default(null),
  nip_pegawai: z.string().min(1).max(25),
  // petugas_id diisi dari JWT token (user yang login)
});

export const ambilPaketSchema = z.object({
  diambil_oleh: z.string().max(100).nullable().default(null),
});
