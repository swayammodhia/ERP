# Custom ERP

High-speed ERP starter focused on accuracy and simplicity.

## Stack

- Next.js + React + TypeScript
- Tailwind CSS
- React Query (TanStack Query)
- Node.js runtime (Next API routes)
- Prisma ORM
- MongoDB Atlas
- Socket.io installed for realtime expansion

## Phase Plan

### Phase 1 (Implemented)

- POS billing (`/api/pos/checkout`)
- Inventory management (`/api/inventory`)
- Products (`/api/products`)
- Invoices (`/api/invoices`)
- Payments (`/api/payments`)
- Dashboard summary (`/api/dashboard/summary`)

### Phase 2 (Implemented)

- Warehouse transfers (`/api/warehouse/transfers`)
- Warehouses (`/api/warehouses`)
- Customer system (`/api/customers`)
- Reports (`/api/reports/overview`)

### Phase 3 (Implemented)

- Accounts (`/api/accounts`)
- Journal entries (`/api/journal-entries`)
- Employee system (`/api/employees`)
- Automation workflows (`/api/automation/workflows`)

## Workspace Note

- The app is in `erp-app/` because the parent folder `ERP/` uses uppercase characters and cannot be used directly as an npm package name by `create-next-app`.

## Database Setup

1. Copy `.env.example` to `.env`.
2. Set your MongoDB Atlas connection string in `DATABASE_URL`.

## Run

```bash
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

## Notes

- This baseline is optimized for speed and a clean operator flow.
- Monetary values are stored as integer minor units to preserve accuracy with MongoDB.
- Stock deduction happens inside DB transactions during POS checkout.
- Warehouse transfer posting updates source and destination stock inside a DB transaction when transfer status is `COMPLETED`.
- Journal entries validate balanced debit and credit totals before posting.
- Payment posting updates invoice balances atomically.
