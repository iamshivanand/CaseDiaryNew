# Custom Workspace Rules

- **Android App Bundle Builds**: Always run a full Gradle clean (`.\gradlew clean`) before compiling the release bundle (`.\gradlew bundleRelease`). Do not rely on incremental or cached updates for release packages.
