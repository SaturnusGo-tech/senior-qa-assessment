import { test, expect } from '../fixtures/account';

test('register, log in, search, add, view, delete and log out', async ({ page, account }) => {
  // The account fixture owns registration and cleanup.
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('UserName').fill(account.userName);
  await page.getByPlaceholder('Password').fill(account.password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.locator('#userName-value')).toHaveText(account.userName);

  await page.goto('/books', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('Type to search').fill(account.book.title);
  const bookLink = page.getByRole('link', { name: account.book.title, exact: true });
  await expect(bookLink).toHaveCount(1);
  await bookLink.click();

  const add = page.getByRole('button', { name: 'Add To Your Collection', exact: true });
  await expect(add, 'The required add-to-collection UI control must be available').toBeVisible();
  const addedDialog = page.waitForEvent('dialog');
  await add.click();
  const added = await addedDialog;
  const message = added.message();
  await added.accept();
  expect(message).toMatch(/book added to your collection/i);

  await page.goto('/profile', { waitUntil: 'domcontentloaded' });
  const row = page.getByRole('row').filter({ has: page.getByRole('link', {
    name: account.book.title, exact: true,
  }) });
  await expect(row).toHaveCount(1);
  // Scope the delete icon to the selected book row.
  await row.locator('[title="Delete"]').click();
  const removedDialog = page.waitForEvent('dialog');
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  const removed = await removedDialog;
  const removedMessage = removed.message();
  await removed.accept();
  expect(removedMessage).toMatch(/book deleted/i);
  await expect(row).toHaveCount(0);
  const [collection] = await Promise.all([
    page.waitForResponse(response =>
      new URL(response.url()).pathname === `/Account/v1/User/${account.userId}` &&
      response.request().method() === 'GET'),
    page.reload({ waitUntil: 'domcontentloaded' }),
  ]);
  expect(collection.status()).toBe(200);
  expect((await collection.json()).books).toEqual([]);
  await expect(page.getByRole('link', { name: account.book.title, exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: /^log\s*out$/i }).click();
  await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);
  await page.goto('/profile', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(/Currently you are not logged into the Book Store application/)).toBeVisible();
});
