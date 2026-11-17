import { randomUUID } from 'node:crypto';
import { test as base, expect } from '@playwright/test';

type Book = { isbn: string; title: string };
type Account = { userId: string; userName: string; password: string; book: Book };

export const test = base.extend<{ account: Account }>({
  account: async ({ playwright }, use) => {
    const api = await playwright.request.newContext({
      baseURL: process.env.DEMOQA_API_URL ?? 'https://demoqa.com',
      timeout: 20_000,
    });
    const userName = `qa_${randomUUID().replaceAll('-', '')}`;
    const password = process.env.DEMOQA_TEST_PASSWORD || `Qa1!${randomUUID()}`;
    let userId: string | undefined;
    try {
      const created = await api.post('/Account/v1/User', { data: { userName, password } });
      expect(created.status(), 'Create disposable account').toBe(201);
      userId = (await created.json()).userID;
      expect(typeof userId).toBe('string');
      expect(userId).toBeTruthy();

      const catalog = await api.get('/BookStore/v1/Books');
      expect(catalog.status()).toBe(200);
      const books: Book[] = (await catalog.json()).books;
      const book = books.find(b => b.title === 'Speaking JavaScript');
      expect(book, 'Expected title is present in the catalog').toBeDefined();
      await use({ userId: userId!, userName, password, book: book! });
    } finally {
      try {
        if (userId) {
          // Browser login can invalidate an earlier token. Authenticate at teardown.
          const login = await api.post('/Account/v1/GenerateToken', { data: { userName, password } });
          expect(login.status(), 'Cleanup authentication').toBe(200);
          const session = await login.json();
          expect(session.status).toBe('Success');
          const token = session.token;
          expect(typeof token, 'Cleanup requires a token').toBe('string');
          expect(token).toBeTruthy();
          const deleted = await api.delete(`/Account/v1/User/${encodeURIComponent(userId)}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          expect(deleted.status(), 'Delete disposable account').toBe(204);
        }
      } finally {
        await api.dispose();
      }
    }
  },
});

export { expect };
