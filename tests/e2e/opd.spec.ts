import { test, expect } from '@playwright/test';

test.describe('OPD Canonical Journey E2E', () => {
  test('Patient walks in, gets queued, consults, and pays', async ({ browser }) => {
    // We use two separate browser contexts for Receptionist and Doctor personas
    const receptionistContext = await browser.newContext();
    const doctorContext = await browser.newContext();

    const receptionistPage = await receptionistContext.newPage();
    const doctorPage = await doctorContext.newPage();

    // ----------------------------------------------------
    // 1. Receptionist Persona: Register & Queue
    // ----------------------------------------------------
    await receptionistPage.goto('http://localhost:3000/staff/login');
    await receptionistPage.fill('input[name="email"]', 'reception@careconnect.local');
    await receptionistPage.fill('input[name="password"]', 'password123');
    await receptionistPage.click('button[type="submit"]');

    await receptionistPage.goto('http://localhost:3000/staff/registration');
    await receptionistPage.fill('input[name="name"]', 'John Doe Walk-In');
    await receptionistPage.fill('input[name="phone"]', '9876543212');
    await receptionistPage.click('button:has-text("Register & Book")');

    await expect(receptionistPage.locator('.text-green-600:has-text("Patient Registered")')).toBeVisible();
    
    await receptionistPage.click('button:has-text("Generate Queue Token")');
    await expect(receptionistPage.locator('.font-bold:has-text("Token: OP-")')).toBeVisible();

    // ----------------------------------------------------
    // 2. Doctor Persona: Consultation
    // ----------------------------------------------------
    await doctorPage.goto('http://localhost:3000/doctor/login');
    await doctorPage.fill('input[name="email"]', 'dr.smith@careconnect.local');
    await doctorPage.fill('input[name="password"]', 'password123');
    await doctorPage.click('button[type="submit"]');

    await doctorPage.goto('http://localhost:3000/doctor/queue');
    await expect(doctorPage.locator('text="John Doe Walk-In"')).toBeVisible();
    await doctorPage.click('button:has-text("Call Next Patient")');
    
    // Clinical Documentation
    await expect(doctorPage.locator('h2:has-text("Active Consultation")')).toBeVisible();
    await doctorPage.fill('textarea[name="clinical_notes"]', 'Patient complains of headache.');
    await doctorPage.fill('input[name="prescription_med"]', 'Ibuprofen 400mg');
    await doctorPage.click('button:has-text("Add Medication")');
    
    await doctorPage.click('button:has-text("Complete Consultation")');
    await expect(doctorPage.locator('.text-green-600:has-text("Consultation Ended")')).toBeVisible();

    // ----------------------------------------------------
    // 3. Receptionist Persona: Billing & Payment
    // ----------------------------------------------------
    await receptionistPage.goto('http://localhost:3000/staff/billing');
    await expect(receptionistPage.locator('text="John Doe Walk-In"')).toBeVisible();
    await receptionistPage.click('button:has-text("Generate Invoice")');
    
    await expect(receptionistPage.locator('.font-bold:has-text("Total: ₹400")')).toBeVisible();
    
    // Receive Cash Payment
    await receptionistPage.selectOption('select[name="payment_method"]', 'CASH');
    await receptionistPage.click('button:has-text("Record Payment")');
    
    await expect(receptionistPage.locator('.text-green-600:has-text("Payment Recorded - PAID")')).toBeVisible();
    await expect(receptionistPage.locator('button:has-text("Print Receipt")')).toBeVisible();

    // Teardown
    await receptionistContext.close();
    await doctorContext.close();
  });
});
