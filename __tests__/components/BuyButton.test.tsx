import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BuyButton from '@/components/BuyButton';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('BuyButton Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockReset();
    });

    it('renders with correct price', () => {
        render(<BuyButton slug="test-product" priceIdr={50000} />);

        expect(screen.getByRole('button')).toHaveTextContent('Beli Sekarang');
        expect(screen.getByRole('button')).toHaveTextContent('50.000');
    });

    it('formats large prices with Indonesian locale', () => {
        render(<BuyButton slug="test-product" priceIdr={1500000} />);

        expect(screen.getByRole('button')).toHaveTextContent('1.500.000');
    });

    it('shows instant delivery message', () => {
        render(<BuyButton slug="test-product" priceIdr={50000} />);

        expect(screen.getByText(/instant digital delivery/i)).toBeInTheDocument();
    });

    it('calls API and redirects on successful purchase', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ orderId: 'order123' }),
        });

        render(<BuyButton slug="my-product" priceIdr={50000} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug: 'my-product' }),
            });
        });

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/checkout/order123');
        });
    });

    it('shows loading state while processing', async () => {
        // Never resolve the fetch to keep loading state
        mockFetch.mockImplementation(() => new Promise(() => { }));

        render(<BuyButton slug="test-product" priceIdr={50000} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(button).toHaveTextContent('Processing...');
            expect(button).toBeDisabled();
        });
    });

    it('shows alert on API error', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
        });

        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => { });

        render(<BuyButton slug="test-product" priceIdr={50000} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(alertMock).toHaveBeenCalledWith('Error creating order. Please try again.');
        });

        alertMock.mockRestore();
    });

    it('shows alert on network error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => { });

        render(<BuyButton slug="test-product" priceIdr={50000} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(alertMock).toHaveBeenCalledWith('Error creating order. Please try again.');
        });

        alertMock.mockRestore();
    });

    it('re-enables button after error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        vi.spyOn(window, 'alert').mockImplementation(() => { });

        render(<BuyButton slug="test-product" priceIdr={50000} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(button).not.toBeDisabled();
            expect(button).toHaveTextContent('Beli Sekarang');
        });
    });

    it('uses correct slug in API call', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ orderId: 'order123' }),
        });

        render(<BuyButton slug="special-product-slug" priceIdr={100000} />);

        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                '/api/orders',
                expect.objectContaining({
                    body: JSON.stringify({ slug: 'special-product-slug' }),
                })
            );
        });
    });
});
