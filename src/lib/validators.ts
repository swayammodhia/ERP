import {
  AccountType,
  AutomationTriggerType,
  EmployeeStatus,
  PaymentMethod,
  TransferStatus,
} from "@prisma/client";
import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

export const productSchema = z.object({
  sku: z.string().min(2).max(40),
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  sellingPrice: z.coerce.number().positive(),
  costPrice: z.coerce.number().nonnegative(),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  reorderLevel: z.coerce.number().int().min(0).default(0),
  openingStock: z.coerce.number().int().min(0).default(0),
});

export const stockAdjustmentSchema = z.object({
  productId: objectIdSchema,
  quantityDelta: z.coerce.number().int().refine((value) => value !== 0, {
    message: "quantityDelta cannot be zero",
  }),
  note: z.string().max(250).optional(),
});

export const posCheckoutSchema = z.object({
  customerName: z.string().max(120).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paidAmount: z.coerce.number().nonnegative(),
  dueDate: z.string().datetime().optional(),
  items: z
    .array(
      z.object({
        productId: objectIdSchema,
        quantity: z.coerce.number().int().positive(),
      }),
    )
    .min(1),
});

export const paymentSchema = z.object({
  invoiceId: objectIdSchema,
  method: z.nativeEnum(PaymentMethod),
  amount: z.coerce.number().positive(),
  transactionRef: z.string().max(120).optional(),
  note: z.string().max(250).optional(),
});

export const customerSchema = z.object({
  code: z.string().min(2).max(30),
  name: z.string().min(2).max(120),
  phone: z.string().max(30).optional(),
  email: z.email().max(120).optional(),
  address: z.string().max(250).optional(),
  creditLimit: z.coerce.number().nonnegative().default(0),
});

export const warehouseSchema = z.object({
  code: z.string().min(2).max(30),
  name: z.string().min(2).max(120),
  location: z.string().max(120).optional(),
});

export const warehouseTransferSchema = z.object({
  fromWarehouseId: objectIdSchema,
  toWarehouseId: objectIdSchema,
  status: z.nativeEnum(TransferStatus).default(TransferStatus.COMPLETED),
  note: z.string().max(250).optional(),
  items: z
    .array(
      z.object({
        productId: objectIdSchema,
        quantity: z.coerce.number().int().positive(),
        unitCost: z.coerce.number().nonnegative().default(0),
      }),
    )
    .min(1),
});

export const accountSchema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(2).max(120),
  type: z.nativeEnum(AccountType),
  description: z.string().max(250).optional(),
});

export const journalEntrySchema = z.object({
  reference: z.string().max(80).optional(),
  memo: z.string().max(250).optional(),
  lines: z
    .array(
      z.object({
        accountId: objectIdSchema,
        debitAmount: z.coerce.number().nonnegative().default(0),
        creditAmount: z.coerce.number().nonnegative().default(0),
        note: z.string().max(120).optional(),
      }),
    )
    .min(2),
});

export const employeeSchema = z.object({
  employeeCode: z.string().min(2).max(30),
  name: z.string().min(2).max(120),
  email: z.email().max(120).optional(),
  phone: z.string().max(30).optional(),
  role: z.string().min(2).max(80),
  department: z.string().max(80).optional(),
  status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.ACTIVE),
});

export const automationWorkflowSchema = z.object({
  name: z.string().min(2).max(120),
  module: z.string().min(2).max(80),
  triggerType: z.nativeEnum(AutomationTriggerType),
  configJson: z.string().max(4000).optional(),
});
