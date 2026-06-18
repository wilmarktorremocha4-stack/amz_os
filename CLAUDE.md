@AGENTS.md

---

# OPERATIONAMZ — MASTER DEVELOPMENT VISION

## Goal

Build an all-in-one Amazon Brand Sourcing Platform to replace:
- SmartScout, Helium 10, Jungle Scout (research & discovery)
- Apollo, Hunter (contact discovery)
- Multiple CRM subscriptions
- Multiple email outreach subscriptions

## Core Modules

1. Brand Sourcing
2. Product Sourcing
3. Contact Discovery
4. CRM Management
5. Email Outreach
6. Email Analytics
7. AI-Powered Lead Qualification
8. Team Management
9. Reporting & Analytics

---

## PHASE 1 — CRM FOUNDATION

Reference: https://github.com/twentyhq/twenty.git

Use Twenty CRM as the architectural foundation. Custom modules needed:
- Brands, Products, Amazon Sellers, Contacts
- Campaigns, Email Templates, Outreach Sequences
- Tasks, Notes, Team Assignments
- Lead Status, Partnership Status

Key things to understand before building: architecture, folder structure, database design, authentication, user roles, customization patterns.

---

## PHASE 2 — DATABASE

Reference: https://github.com/supabase/supabase.git

Use Supabase for: Database, Auth, Storage, Realtime Events, Row Level Security.

Tables needed: Brands, Products, Sellers, Contacts, Email Templates, Email Campaigns, Email Analytics, Team Members, Notes, Activities, Tasks.

Always generate: complete schema, relationships, foreign keys, recommended indexes.

---

## PHASE 3 — BRAND FINDER (SmartScout replacement)

Reference: https://github.com/apify

Features: Brand Search, Brand Store Discovery, Seller Discovery, Product Discovery, Category Discovery.

Display per brand: Brand Name, Store URL, # Products, Estimated Revenue, Seller Count, Category, Contact Status.

---

## PHASE 4 — PRODUCT FINDER (Helium 10 replacement)

References: https://github.com/keepacom/api_backend · https://www.rainforestapi.com

Features: ASIN Search, Keyword Search, Brand Search, Product Opportunity Finder, Price Tracking, BSR Tracking.

Display: ASIN, Product Name, Brand, Category, Price, BSR, Seller Count, Buy Box.

---

## PHASE 5 — CONTACT FINDER (Apollo replacement)

Enrich brands with: Website, Contact Page, Email, LinkedIn, Instagram, Facebook, Phone Number.

Everything stored in CRM automatically.

---

## PHASE 6 — EMAIL TEMPLATE BUILDER

Reference: https://github.com/usewaypoint/email-builder-js.git

Features: Drag-and-drop builder, save/duplicate/categorize/preview/share templates, version history.

---

## PHASE 7 — EMAIL ANALYTICS

Reference: https://github.com/usesend/useSend.git

Metrics: Opens, Clicks, Deliveries, Bounces, Unsubscribes — real-time, at campaign / contact / brand / team level.

---

## PHASE 8 — AUTOMATIONS

Reference: https://github.com/n8n-io/n8n.git

Primary workflow:
Brand Found → Enrich Contact → Store in CRM → Assign Team Member → Send Outreach → Track Replies → Lead Qualification

Additional: scheduled scraping, email sequences, AI workflows, lead routing, notifications, reporting.

---

## PHASE 9 — AI LAYER

Reference: https://github.com/langflow-ai/langflow.git

Features: Brand qualification, lead scoring, outreach personalization, email writing, brand/seller/product opportunity analysis.

---

## PHASE 10 — FRONTEND

Reference: https://github.com/vercel/nextjs-subscription-payments.git

Pages: Dashboard, Brands, Products, Sellers, Contacts, Campaigns, Templates, Analytics, Settings, Admin.

Features: Authentication, user management, team management, permissions, reports.

---

## Final Deliverables (when architecting any new feature)

Always consider and document:
1. System architecture impact
2. Database schema changes
3. Folder structure
4. API design
5. Auth/permissions
6. Security
7. MVP vs Phase 2/3 scope
8. Deployment/hosting implications
