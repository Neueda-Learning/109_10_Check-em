# Team Commit Batch Plan (Sequential + Equal Split)

## Scope used for this plan
- Includes project source and config files from:
  - `backend/`
  - `frontend/shopflow-payments-main/`
- Excludes generated build outputs (`backend/target/`, `frontend/shopflow-payments-main/.output/`, `frontend/shopflow-payments-main/.wrangler/`, `node_modules/`, `dist/`).

## Equality target
- Mathew: 49 files
- Chetan: 49 files
- Krishnaja: 49 files
- Total: 147 files

## Commit / MR sequence
- Batch 01 to 06: backend + frontend foundation
- Batch 07 to 09: security/login
- Batch 10 to 12: integration/finalization

---

## Batch 01 - Mathew (Foundation A)
1. backend/pom.xml
2. backend/mvnw
3. backend/mvnw.cmd
4. backend/schema.sql
5. backend/src/main/resources/application.properties
6. backend/src/main/java/com/payflow/PayflowApplication.java
7. backend/src/main/java/com/payflow/config/AppConfig.java
8. backend/src/main/java/com/payflow/controller/PaymentController.java
9. backend/src/main/java/com/payflow/controller/MerchantController.java
10. backend/src/main/java/com/payflow/service/PaymentService.java
11. backend/src/main/java/com/payflow/service/MerchantService.java
12. backend/src/main/java/com/payflow/repository/PaymentRepository.java
13. backend/src/main/java/com/payflow/repository/MerchantRepository.java

## Batch 02 - Chetan (Foundation A)
1. frontend/shopflow-payments-main/README.md
2. frontend/shopflow-payments-main/AGENTS.md
3. frontend/shopflow-payments-main/bunfig.toml
4. frontend/shopflow-payments-main/components.json
5. frontend/shopflow-payments-main/eslint.config.js
6. frontend/shopflow-payments-main/package-lock.json
7. frontend/shopflow-payments-main/public/favicon.ico
8. frontend/shopflow-payments-main/public/robots.txt
9. frontend/shopflow-payments-main/src/components/site-header.tsx
10. frontend/shopflow-payments-main/src/components/theme-toggle.tsx
11. frontend/shopflow-payments-main/src/routes/autopay.tsx
12. frontend/shopflow-payments-main/src/routes/gateway.tsx
13. frontend/shopflow-payments-main/src/routes/pay.charity.tsx

## Batch 03 - Krishnaja (Foundation A)
1. backend/src/main/java/com/payflow/service/BankRoutingService.java
2. backend/src/main/java/com/payflow/service/CurrencyConversionService.java
3. backend/src/main/java/com/payflow/repository/BankRoutingRepository.java
4. backend/src/main/java/com/payflow/repository/CurrencyConversionRepository.java
5. backend/src/main/java/com/payflow/model/BankNode.java
6. backend/src/main/java/com/payflow/model/BankRouteHistory.java
7. backend/src/main/java/com/payflow/model/CurrencyConversionRecord.java
8. backend/src/main/java/com/payflow/dto/UpdateMerchantRequest.java
9. backend/src/main/java/com/payflow/enums/PaymentMethod.java
10. backend/src/main/java/com/payflow/exception/ProcessingException.java
11. backend/src/main/java/com/payflow/exception/ResourceNotFoundException.java
12. frontend/shopflow-payments-main/src/lib/error-capture.ts
13. frontend/shopflow-payments-main/src/lib/error-page.ts

## Batch 04 - Mathew (Foundation B)
1. backend/src/main/java/com/payflow/service/DatabaseSchemaService.java
2. backend/src/main/java/com/payflow/repository/PaymentStatusHistoryRepository.java
3. backend/src/main/java/com/payflow/repository/PaymentReversalRepository.java
4. backend/src/main/java/com/payflow/model/Payment.java
5. backend/src/main/java/com/payflow/model/Merchant.java
6. backend/src/main/java/com/payflow/model/PaymentStatusHistory.java
7. backend/src/main/java/com/payflow/model/PaymentReversal.java
8. backend/src/main/java/com/payflow/dto/CreatePaymentRequest.java
9. backend/src/main/java/com/payflow/dto/UpdatePaymentRequest.java
10. backend/src/main/java/com/payflow/dto/ProcessPaymentRequest.java
11. backend/src/main/java/com/payflow/dto/ReversePaymentRequest.java
12. backend/src/main/java/com/payflow/enums/PaymentStatus.java
13. frontend/shopflow-payments-main/src/routes/pay.method.tsx

## Batch 05 - Chetan (Foundation B)
1. backend/src/main/java/com/payflow/dto/DashboardMerchantResponse.java
2. backend/src/main/java/com/payflow/dto/MerchantSettingsResponse.java
3. backend/src/main/java/com/payflow/exception/ApiException.java
4. backend/src/main/java/com/payflow/exception/BadRequestException.java
5. frontend/shopflow-payments-main/src/routes/README.md
6. frontend/shopflow-payments-main/src/routes/index.tsx
7. frontend/shopflow-payments-main/src/hooks/use-mobile.tsx
8. frontend/shopflow-payments-main/src/components/ui/accordion.tsx
9. frontend/shopflow-payments-main/src/components/ui/alert.tsx
10. frontend/shopflow-payments-main/src/components/ui/alert-dialog.tsx
11. frontend/shopflow-payments-main/src/components/ui/aspect-ratio.tsx
12. frontend/shopflow-payments-main/src/components/ui/avatar.tsx
13. frontend/shopflow-payments-main/src/components/ui/badge.tsx

## Batch 06 - Krishnaja (Foundation B)
1. frontend/shopflow-payments-main/src/lib/lovable-error-reporting.ts
2. frontend/shopflow-payments-main/src/styles.css
3. frontend/shopflow-payments-main/src/components/ui/context-menu.tsx
4. frontend/shopflow-payments-main/src/components/ui/dialog.tsx
5. frontend/shopflow-payments-main/src/components/ui/drawer.tsx
6. frontend/shopflow-payments-main/src/components/ui/dropdown-menu.tsx
7. frontend/shopflow-payments-main/src/components/ui/form.tsx
8. frontend/shopflow-payments-main/src/components/ui/hover-card.tsx
9. frontend/shopflow-payments-main/src/components/ui/input.tsx
10. frontend/shopflow-payments-main/src/components/ui/input-otp.tsx
11. frontend/shopflow-payments-main/src/components/ui/label.tsx
12. frontend/shopflow-payments-main/src/components/ui/menubar.tsx
13. frontend/shopflow-payments-main/src/components/ui/navigation-menu.tsx

## Batch 07 - Mathew (Security/Login)
1. backend/src/main/java/com/payflow/dto/AuthPinRequest.java
2. backend/src/main/java/com/payflow/enums/Role.java
3. frontend/shopflow-payments-main/src/routes/company.$code.tsx

## Batch 08 - Chetan (Security/Login)
1. backend/src/main/java/com/payflow/controller/UserController.java
2. backend/src/main/java/com/payflow/service/UserService.java
3. backend/src/main/java/com/payflow/repository/UserRepository.java
4. backend/src/main/java/com/payflow/model/User.java
5. backend/src/main/java/com/payflow/dto/CreateUserRequest.java
6. backend/src/main/java/com/payflow/dto/UpdateStatusRequest.java
7. backend/src/main/java/com/payflow/exception/GlobalExceptionHandler.java
8. frontend/shopflow-payments-main/src/routes/company.$code.login.tsx
9. frontend/shopflow-payments-main/src/lib/company-session.ts

## Batch 09 - Krishnaja (Security/Login)
1. backend/src/main/java/com/payflow/dto/UpdateUserRequest.java
2. frontend/shopflow-payments-main/src/routes/company.$code.settings.tsx

## Batch 10 - Mathew (Integration / Finalization)
1. frontend/shopflow-payments-main/package.json
2. frontend/shopflow-payments-main/tsconfig.json
3. frontend/shopflow-payments-main/vite.config.ts
4. frontend/shopflow-payments-main/src/router.tsx
5. frontend/shopflow-payments-main/src/routes/__root.tsx
6. frontend/shopflow-payments-main/src/routes/pay.processing.tsx
7. frontend/shopflow-payments-main/src/routes/pay.receipt.$id.tsx
8. frontend/shopflow-payments-main/src/routes/pay.verify.tsx
9. frontend/shopflow-payments-main/src/routes/payments.$id.tsx
10. frontend/shopflow-payments-main/src/routes/payments.index.tsx
11. frontend/shopflow-payments-main/src/components/checkout-shell.tsx
12. frontend/shopflow-payments-main/src/components/order-summary.tsx
13. frontend/shopflow-payments-main/src/components/payment-timeline.tsx
14. frontend/shopflow-payments-main/src/hooks/use-gateway-store.ts
15. frontend/shopflow-payments-main/src/hooks/use-draft.ts
16. frontend/shopflow-payments-main/src/lib/gateway.ts
17. frontend/shopflow-payments-main/src/lib/gateway.validation.test.ts
18. frontend/shopflow-payments-main/src/lib/utils.ts
19. frontend/shopflow-payments-main/src/server.ts
20. frontend/shopflow-payments-main/src/start.ts

## Batch 11 - Chetan (Integration / Finalization)
1. backend/src/test/java/com/payflow/controller/UserControllerTest.java
2. backend/src/test/java/com/payflow/controller/MerchantControllerTest.java
3. frontend/shopflow-payments-main/src/routeTree.gen.ts
4. frontend/shopflow-payments-main/src/components/ui/breadcrumb.tsx
5. frontend/shopflow-payments-main/src/components/ui/button.tsx
6. frontend/shopflow-payments-main/src/components/ui/calendar.tsx
7. frontend/shopflow-payments-main/src/components/ui/card.tsx
8. frontend/shopflow-payments-main/src/components/ui/carousel.tsx
9. frontend/shopflow-payments-main/src/components/ui/chart.tsx
10. frontend/shopflow-payments-main/src/components/ui/checkbox.tsx
11. frontend/shopflow-payments-main/src/components/ui/collapsible.tsx
12. frontend/shopflow-payments-main/src/components/ui/command.tsx
13. frontend/shopflow-payments-main/src/components/ui/toggle-group.tsx
14. frontend/shopflow-payments-main/src/components/ui/tooltip.tsx

## Batch 12 - Krishnaja (Integration / Finalization)
1. backend/src/test/java/com/payflow/controller/PaymentControllerTest.java
2. backend/src/test/java/com/payflow/service/PaymentServiceTest.java
3. backend/src/test/java/com/payflow/integration/DashboardMerchantsIntegrationTest.java
4. frontend/shopflow-payments-main/src/components/ui/pagination.tsx
5. frontend/shopflow-payments-main/src/components/ui/popover.tsx
6. frontend/shopflow-payments-main/src/components/ui/progress.tsx
7. frontend/shopflow-payments-main/src/components/ui/radio-group.tsx
8. frontend/shopflow-payments-main/src/components/ui/resizable.tsx
9. frontend/shopflow-payments-main/src/components/ui/scroll-area.tsx
10. frontend/shopflow-payments-main/src/components/ui/select.tsx
11. frontend/shopflow-payments-main/src/components/ui/separator.tsx
12. frontend/shopflow-payments-main/src/components/ui/sheet.tsx
13. frontend/shopflow-payments-main/src/components/ui/sidebar.tsx
14. frontend/shopflow-payments-main/src/components/ui/skeleton.tsx
15. frontend/shopflow-payments-main/src/components/ui/slider.tsx
16. frontend/shopflow-payments-main/src/components/ui/sonner.tsx
17. frontend/shopflow-payments-main/src/components/ui/switch.tsx
18. frontend/shopflow-payments-main/src/components/ui/table.tsx
19. frontend/shopflow-payments-main/src/components/ui/tabs.tsx
20. frontend/shopflow-payments-main/src/components/ui/textarea.tsx
21. frontend/shopflow-payments-main/src/components/ui/toggle.tsx

---
Note: The 12 batches above are the operational commit sequence. Keep file ownership fixed per batch to preserve equal contribution evidence in review.
