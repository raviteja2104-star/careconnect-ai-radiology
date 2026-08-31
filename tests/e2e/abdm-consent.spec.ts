import { test, expect } from '@playwright/test';

test.describe('ABDM Consent Workflow E2E', () => {
  test('Patient receives consent request, approves it, and later revokes it', async ({ browser }) => {
    const patientContext = await browser.newContext();
    const patientPage = await patientContext.newPage();

    // ----------------------------------------------------
    // 1. Patient Login
    // ----------------------------------------------------
    await patientPage.goto('http://localhost:3000/patient/login');
    await patientPage.fill('input[name="email"]', 'jane.fhir@example.com');
    await patientPage.fill('input[name="password"]', 'password123');
    await patientPage.click('button[type="submit"]');

    // ----------------------------------------------------
    // 2. Review Consent Request
    // ----------------------------------------------------
    await patientPage.goto('http://localhost:3000/patient/consent');
    await expect(patientPage.locator('text="New Health Record Request"')).toBeVisible();
    
    // Simulate expanding the consent details
    await patientPage.click('button:has-text("Review Details")');
    await expect(patientPage.locator('text="Purpose: Care Management"')).toBeVisible();
    await expect(patientPage.locator('text="Scope: DiagnosticReport, Prescription"')).toBeVisible();

    // ----------------------------------------------------
    // 3. Approve Consent
    // ----------------------------------------------------
    await patientPage.click('button:has-text("Approve Request")');
    await expect(patientPage.locator('.text-green-600:has-text("Consent Granted")')).toBeVisible();

    // Verify Audit log visually on patient portal (transparency)
    await patientPage.click('a:has-text("Audit Log")');
    await expect(patientPage.locator('text="Data exchange authorized"')).toBeVisible();

    // ----------------------------------------------------
    // 4. Revoke Consent
    // ----------------------------------------------------
    await patientPage.goto('http://localhost:3000/patient/consent/active');
    await patientPage.click('button:has-text("Revoke Access")');
    
    // Confirm dialog
    await expect(patientPage.locator('text="Are you sure you want to revoke this consent?"')).toBeVisible();
    await patientPage.click('button:has-text("Confirm Revocation")');

    await expect(patientPage.locator('.text-green-600:has-text("Consent Revoked Successfully")')).toBeVisible();

    // Teardown
    await patientContext.close();
  });
});
