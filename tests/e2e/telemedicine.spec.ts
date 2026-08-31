import { test, expect } from '@playwright/test';

test.describe('Telemedicine E2E Golden Path', () => {
  test('Patient books consultation and doctor conducts session', async ({ browser }) => {
    // We use two separate browser contexts for Patient and Doctor personas
    const patientContext = await browser.newContext();
    const doctorContext = await browser.newContext();

    const patientPage = await patientContext.newPage();
    const doctorPage = await doctorContext.newPage();

    // ----------------------------------------------------
    // 1. Patient Persona: Book Appointment
    // ----------------------------------------------------
    await patientPage.goto('http://localhost:3000/patient/login');
    await patientPage.fill('input[name="email"]', 'jane.doe@example.com');
    await patientPage.fill('input[name="password"]', 'password123');
    await patientPage.click('button[type="submit"]');

    await patientPage.goto('http://localhost:3000/patient/book');
    await patientPage.selectOption('select[name="type"]', 'TELEMEDICINE');
    await patientPage.click('button:has-text("Confirm Booking")');

    await expect(patientPage.locator('.text-green-600:has-text("Booking Confirmed")')).toBeVisible();

    // ----------------------------------------------------
    // 2. Doctor Persona: Join Session
    // ----------------------------------------------------
    await doctorPage.goto('http://localhost:3000/doctor/login');
    await doctorPage.fill('input[name="email"]', 'dr.smith@careconnect.local');
    await doctorPage.fill('input[name="password"]', 'password123');
    await doctorPage.click('button[type="submit"]');

    await doctorPage.goto('http://localhost:3000/doctor/queue');
    await doctorPage.click('button:has-text("Join Session")');
    await expect(doctorPage.locator('.text-blue-600:has-text("Waiting for Patient")')).toBeVisible();

    // ----------------------------------------------------
    // 3. Patient Persona: Join Waiting Room
    // ----------------------------------------------------
    await patientPage.goto('http://localhost:3000/patient/appointments');
    await patientPage.click('button:has-text("Join Waiting Room")');
    await expect(patientPage.locator('text="Camera and Microphone check passed"')).toBeVisible();
    await patientPage.click('button:has-text("Enter Consultation")');

    // ----------------------------------------------------
    // 4. Doctor Persona: Conduct and End Session
    // ----------------------------------------------------
    await expect(doctorPage.locator('text="Patient Connected"')).toBeVisible();
    await doctorPage.click('button:has-text("End Consultation")');
    
    // Simulate reviewing AI summary and finalizing
    await expect(doctorPage.locator('text="AI Summary Draft"')).toBeVisible();
    await doctorPage.click('button:has-text("Finalize & Generate Invoice")');

    // ----------------------------------------------------
    // 5. Patient Persona: Pay Invoice
    // ----------------------------------------------------
    await patientPage.goto('http://localhost:3000/patient/billing');
    await patientPage.click('button:has-text("Pay Now")');
    
    // Simulating Payment Gateway interaction
    await patientPage.click('button:has-text("Simulate Razorpay Success")');
    
    await expect(patientPage.locator('.text-green-600:has-text("Payment Successful")')).toBeVisible();

    // Teardown
    await patientContext.close();
    await doctorContext.close();
  });
});
