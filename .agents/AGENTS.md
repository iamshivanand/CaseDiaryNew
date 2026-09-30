# Custom Workspace Rules

- **Android App Bundle Builds**: Always run a full Gradle clean (`.\gradlew clean`) before compiling the release bundle (`.\gradlew bundleRelease`). Do not rely on incremental or cached updates for release packages.
- **Unified Web & App Engineering Standards**: All web application (`casediary-web`) and mobile app work must adhere to the master rulebook in [ENGINEERING_AND_DESIGN_RULEBOOK.md](file:///e:/Projects/2026/CaseDiaryNew/docs/ENGINEERING_AND_DESIGN_RULEBOOK.md). Maintain visual design parity, open-source engine standards (TipTap for drafting), database agnosticism (Drizzle ORM for SQLite/PostgreSQL), and performance optimizations from day one.

