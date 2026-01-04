import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test case
afterEach(() => {
    cleanup();
});

// Mock window.alert globally
global.alert = vi.fn();

// Mock environment variables for tests
vi.stubEnv('MONGODB_URI', 'mongodb://localhost:27017/test');
vi.stubEnv('ADMIN_PASSWORD', 'test_admin_password');
vi.stubEnv('JWT_SECRET', 'test_jwt_secret_key_for_testing');
vi.stubEnv('CONTENT_ENCRYPTION_KEY', 'abcdefghijklmnopqrstuvwxyz123456');
