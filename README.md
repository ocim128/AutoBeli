# AutoBeli - Digital Text Store

A secure, single-vendor digital product store for text-based content. Built with **Next.js 15**, **MongoDB**, & **TypeScript**.

## Features

- **Public Storefront**: Browse encrypted text products.
- **Secure Delivery**: Content is **AES-256** encrypted at rest.
- **Instant Access**: Automated delivery upon payment confirmation.
- **Admin Dashboard**: Manage products and view orders.
- **Veripay Payment Gateway**: Integrated with veripay.site for QRIS, Virtual Account, and E-Wallet payments.
- **Mock Payment**: Optional mock gateway for development/testing (set `PAYMENT_GATEWAY=MOCK`).

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: MongoDB (Native Driver for speed)
- **Styling**: Tailwind CSS v4
- **Auth**: JWT (Admin), Token-based (Content Access)

## Getting Started

1.  **Clone & Install**

    ```bash
    npm install
    ```

2.  **Environment Setup**
    Copy `.env.example` to `.env` and fill in:
    - `MONGODB_URI`: Your Atlas connection string.
    - `ADMIN_PASSWORD`: Access key for admin panel.
    - `CONTENT_ENCRYPTION_KEY`: A 32-character random string.
    - `PAYMENT_GATEWAY`: Set to `VERIPAY` (production) or `MOCK` (development).
    - `VERIPAY_API_KEY`: Your Veripay API key.
    - `VERIPAY_SECRET_KEY`: Your Veripay secret key.

3.  **Run Locally**
    ```bash
    npm run dev
    ```

## Admin Access

- URL: `/admin` (Redirects to login)
- Default Password: See your `.env` `ADMIN_PASSWORD`.

## Security Notes

- Content is never sent to the client until a valid access token is presented.
- Access tokens have rate limits (2s cooldown).
- Content responses use strict `Cache-Control: no-store` headers.

## License

Private.
