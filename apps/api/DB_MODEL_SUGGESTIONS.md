# API Persistence Model Suggestions (Spring Boot + JDBC)

These are practical model suggestions for the new PostgreSQL schema. Keep the API demo-first by starting with DTOs + row mappers (no heavy ORM required yet).

## Suggested Java Enums

- `OutletLicenseType`: `CL2`, `CL7`, `CL9`
- `UploadType`: `DAILY_SALES`, `DAILY_STOCK`, `MANUAL_CORRECTION`
- `UploadStatus`: `RECEIVED`, `PROCESSED`, `FAILED`, `CORRECTED`
- `UserRole`: `HQ_ADMIN`, `REGIONAL_MANAGER`, `AUDITOR`, `DEMO_VIEWER`
- `AnomalySeverity`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `AnomalyStatus`: `OPEN`, `ACKNOWLEDGED`, `RESOLVED`, `FALSE_POSITIVE`

## Suggested Record Models

Create under `apps/api/src/main/java/com/ishakti/barops/api/model/`:

- `OutletRecord`
  - `UUID id`, `String outletCode`, `String outletName`, `OutletLicenseType licenseType`
  - `String city`, `String state`, `String zone`, `String locality`
  - `UUID peerGroupId`, `LocalDate openedOn`, `boolean isActive`
  - `Instant createdAt`, `Instant updatedAt`
- `DailySalesRecord`
  - `UUID id`, `UUID outletId`, `UUID productId`, `LocalDate salesDate`
  - `int unitsSold`, `BigDecimal grossRevenue`, `BigDecimal netRevenue`, `BigDecimal discountAmount`
  - `UUID uploadId`, `Instant createdAt`, `Instant updatedAt`
- `DailyStockRecord`
  - `UUID id`, `UUID outletId`, `UUID productId`, `LocalDate stockDate`
  - `int openingUnits`, `int inwardUnits`, `int soldUnits`
  - `int expectedClosingUnits`, `int actualClosingUnits`, `int varianceUnits`
  - `BigDecimal variancePercent`, `UUID uploadId`
- `UploadRecord`
  - `UUID id`, `UUID outletId`, `UploadType uploadType`, `SignalSource source`
  - `LocalDate uploadDate`, `UploadStatus status`, `String fileName`, `String checksumSha256`
  - `UUID uploadedByUserId`, `int recordsCount`, `int errorCount`
  - `UUID supersedesUploadId`, `String correctionNote`
- `AnomalyRecord`
  - `UUID id`, `UUID outletId`, `UUID productId`, `LocalDate anomalyDate`
  - `String ruleCode`, `AnomalySeverity severity`, `AnomalyStatus status`
  - `int riskScoreDelta`, `String summary`, `String detailsJson`

## Suggested Repository Split

- `OutletRepository`
  - `findAllActive()`
  - `findByZoneAndLicenseType(...)`
  - `findPeerComparableOutlets(outletId)`
- `UploadRepository`
  - `createUpload(...)`
  - `markUploadStatus(...)`
  - `findCorrectionChain(uploadId)`
- `StockRepository`
  - `upsertDailyStock(...)`
  - `findVarianceBreaches(date, thresholdPercent)`
- `AnomalyRepository`
  - `insertDetectedAnomaly(...)`
  - `findOpenByOutletAndDate(...)`
- `ExecutiveSummaryRepository`
  - `saveWeeklySummary(...)`
  - `findLatestForScope(...)`

## Suggested First API Endpoints (Next Step)

- `GET /api/v1/outlets`
- `GET /api/v1/outlets/{id}/risk?date=YYYY-MM-DD`
- `GET /api/v1/uploads?date=YYYY-MM-DD`
- `GET /api/v1/anomalies?status=OPEN`
- `GET /api/v1/executive-summary/latest?scopeType=CITY`

Keep these read-heavy initially; add write endpoints after schema + demo ingestion is stable.
