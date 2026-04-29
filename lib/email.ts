// lib/email.ts
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.EMAIL_HOST;
const SMTP_USER = process.env.EMAIL_USER;
const SMTP_PASS = process.env.EMAIL_PASS;
const FROM_EMAIL = process.env.EMAIL_USER;

// Create transporter
const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: 587,
    secure: false, // true for 465
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

// Email templates
export const sendNewLeadEmail = async (leadData: any, assignedAgentEmail?: string) => {
    const subject = `New Lead: ${leadData.name} - ${leadData.propertyInterest}`;
    const html = `
    <h2>New Lead Created</h2>
    <p>A new lead has been added to the CRM:</p>
    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
      <tr><th>Field</th><th>Value</th></tr>
      <tr><td>Name</td><td>${leadData.name}</td></tr>
      <tr><td>Email</td><td>${leadData.email}</td></tr>
      <tr><td>Phone</td><td>${leadData.phone}</td></tr>
      <tr><td>Property Interest</td><td>${leadData.propertyInterest}</td></tr>
      <tr><td>Budget</td><td>PKR ${leadData.budget.toLocaleString()}</td></tr>
      <tr><td>Priority Score</td><td>${leadData.score}</td></tr>
      <tr><td>Status</td><td>${leadData.status}</td></tr>
    </table>
    <p>Login to the CRM to view and manage this lead.</p>
  `;

    // Send to admin(s) – you might have multiple, here we send to a default admin email
    const adminEmail = process.env.ADMIN_EMAIL || SMTP_USER;
    await transporter.sendMail({
        from: FROM_EMAIL,
        to: adminEmail,
        subject,
        html,
    });

    // Also send to assigned agent if provided and not same as admin
    if (assignedAgentEmail && assignedAgentEmail !== adminEmail) {
        await transporter.sendMail({
            from: FROM_EMAIL,
            to: assignedAgentEmail,
            subject: `New Lead Assigned to You: ${leadData.name}`,
            html: `
        <h2>New Lead Assigned</h2>
        <p>A new lead has been assigned to you:</p>
        <table border="1" ...>...</table>
        <p>Please follow up promptly.</p>
      `,
        });
    }
};

export const sendLeadAssignmentEmail = async (leadName: string, agentEmail: string, assignedByName: string) => {
    const subject = `Lead Assigned: ${leadName}`;
    const html = `
    <h2>Lead Assignment</h2>
    <p>${assignedByName} has assigned the lead "<strong>${leadName}</strong>" to you.</p>
    <p>Please log in to the CRM to view details and take action.</p>
    <p>Thank you.</p>
  `;
    await transporter.sendMail({
        from: FROM_EMAIL,
        to: agentEmail,
        subject,
        html,
    });
};