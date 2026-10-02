import { vi } from "vitest";

// Mock environment variables for tests
vi.stubEnv("MONGODB_URI", "mongodb://localhost:27017/test");
vi.stubEnv("ADMIN_PASSWORD", "test_admin_password");
vi.stubEnv("JWT_SECRET", "test_jwt_secret_key_for_testing");
vi.stubEnv("CONTENT_ENCRYPTION_KEY", "abcdefghijklmnopqrstuvwxyz123456");
