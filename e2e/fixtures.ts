import { randomBytes } from "node:crypto";
import { test as base } from "@playwright/test";

export const test = base.extend({
  extraHTTPHeaders: async ({}, provideHeaders) => {
    const groups = randomBytes(6).toString("hex").match(/.{4}/g)!.join(":");
    await provideHeaders({ "x-forwarded-for": `2001:db8:${groups}::1` });
  },
});

export { expect } from "@playwright/test";
