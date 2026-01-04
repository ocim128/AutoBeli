/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Create test versions of crypto functions with a test key
const TEST_ENCRYPTION_KEY = 'abcdefghijklmnopqrstuvwxyz123456'; // 32 chars
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function encryptContent(text: string): string {
    if (!text) return '';
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, Buffer.from(TEST_ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptContent(text: string): string {
    if (!text) return '';
    const textParts = text.split(':');
    const ivPart = textParts.shift();
    if (!ivPart) throw new Error('Invalid encrypted text format');

    const iv = Buffer.from(ivPart, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = createDecipheriv(ALGORITHM, Buffer.from(TEST_ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

describe('Crypto Module', () => {
    describe('encryptContent', () => {
        it('encrypts text content', () => {
            const plaintext = 'Hello, World!';
            const encrypted = encryptContent(plaintext);

            expect(encrypted).toBeDefined();
            expect(encrypted).not.toBe(plaintext);
            expect(encrypted.length).toBeGreaterThan(0);
        });

        it('returns empty string for empty input', () => {
            const encrypted = encryptContent('');
            expect(encrypted).toBe('');
        });

        it('produces output in correct format (iv:ciphertext)', () => {
            const encrypted = encryptContent('test');

            // Should contain a colon separator
            expect(encrypted).toContain(':');

            const parts = encrypted.split(':');
            expect(parts.length).toBeGreaterThanOrEqual(2);

            // IV should be 32 hex chars (16 bytes)
            expect(parts[0]).toHaveLength(32);
            expect(parts[0]).toMatch(/^[a-f0-9]+$/);
        });

        it('produces different ciphertext for same plaintext (due to random IV)', () => {
            const plaintext = 'Same text';
            const encrypted1 = encryptContent(plaintext);
            const encrypted2 = encryptContent(plaintext);

            // Should not be equal due to random IV
            expect(encrypted1).not.toBe(encrypted2);
        });

        it('handles unicode content', () => {
            const plaintext = '你好世界 🌍 مرحبا';
            const encrypted = encryptContent(plaintext);

            expect(encrypted).toBeDefined();
            expect(encrypted.length).toBeGreaterThan(0);
        });

        it('handles long content', () => {
            const plaintext = 'x'.repeat(10000);
            const encrypted = encryptContent(plaintext);

            expect(encrypted).toBeDefined();
            expect(encrypted.length).toBeGreaterThan(0);
        });

        it('handles special characters', () => {
            const plaintext = '!@#$%^&*()_+-={}[]|:";\'<>?,./`~';
            const encrypted = encryptContent(plaintext);

            expect(encrypted).toBeDefined();
        });

        it('handles newlines and whitespace', () => {
            const plaintext = 'Line 1\nLine 2\r\nLine 3\t\tTabbed';
            const encrypted = encryptContent(plaintext);

            expect(encrypted).toBeDefined();
        });
    });

    describe('decryptContent', () => {
        it('decrypts encrypted content correctly', () => {
            const original = 'Hello, World!';
            const encrypted = encryptContent(original);
            const decrypted = decryptContent(encrypted);

            expect(decrypted).toBe(original);
        });

        it('returns empty string for empty input', () => {
            const decrypted = decryptContent('');
            expect(decrypted).toBe('');
        });

        it('decrypts unicode content', () => {
            const original = '你好世界 🌍 مرحبا';
            const encrypted = encryptContent(original);
            const decrypted = decryptContent(encrypted);

            expect(decrypted).toBe(original);
        });

        it('decrypts long content', () => {
            const original = 'x'.repeat(10000);
            const encrypted = encryptContent(original);
            const decrypted = decryptContent(encrypted);

            expect(decrypted).toBe(original);
        });

        it('decrypts content with special characters', () => {
            const original = '!@#$%^&*()_+-={}[]|:";\'<>?,./`~';
            const encrypted = encryptContent(original);
            const decrypted = decryptContent(encrypted);

            expect(decrypted).toBe(original);
        });

        it('decrypts content with newlines', () => {
            const original = 'Line 1\nLine 2\r\nLine 3';
            const encrypted = encryptContent(original);
            const decrypted = decryptContent(encrypted);

            expect(decrypted).toBe(original);
        });

        it('throws error for invalid encrypted format (no colon)', () => {
            expect(() => decryptContent('invaliddata')).toThrow();
        });

        it('throws error for corrupted ciphertext', () => {
            const encrypted = encryptContent('test');
            const corrupted = encrypted.slice(0, -10) + 'corrupted!';

            expect(() => decryptContent(corrupted)).toThrow();
        });

        it('throws error for wrong IV length', () => {
            expect(() => decryptContent('abc:def')).toThrow();
        });
    });

    describe('encrypt-decrypt roundtrip', () => {
        const testCases = [
            'Simple text',
            '12345',
            '',
            'a',
            'Multi\nLine\nContent',
            'JSON: {"key": "value", "num": 123}',
            'HTML: <div class="test">Content</div>',
            'SQL: SELECT * FROM users WHERE id = 1;',
            'Code: const x = () => { return true; };',
            '    Leading and trailing whitespace    ',
        ];

        testCases.forEach((testCase, index) => {
            it(`roundtrip test #${index + 1}: "${testCase.substring(0, 30)}..."`, () => {
                if (testCase === '') {
                    // Empty string returns empty
                    expect(decryptContent(encryptContent(testCase))).toBe('');
                } else {
                    const encrypted = encryptContent(testCase);
                    const decrypted = decryptContent(encrypted);
                    expect(decrypted).toBe(testCase);
                }
            });
        });
    });
});
