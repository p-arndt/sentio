import { db } from '$lib/server/db';
import { settings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';

export interface EmailConfig {
	host: string;
	port: number;
	username: string;
	password: string;
	fromEmail: string;
}

async function getEmailConfig(): Promise<EmailConfig | null> {
	try {
		const [host, port, username, password, fromEmail] = await Promise.all([
			db
				.select()
				.from(settings)
				.where(eq(settings.key, 'smtpHost'))
				.then((result) => result[0]?.value),
			db
				.select()
				.from(settings)
				.where(eq(settings.key, 'smtpPort'))
				.then((result) => result[0]?.value),
			db
				.select()
				.from(settings)
				.where(eq(settings.key, 'smtpUsername'))
				.then((result) => result[0]?.value),
			db
				.select()
				.from(settings)
				.where(eq(settings.key, 'smtpPassword'))
				.then((result) => result[0]?.value),
			db
				.select()
				.from(settings)
				.where(eq(settings.key, 'smtpFromEmail'))
				.then((result) => result[0]?.value)
		]);

		if (!host || !port || !username || !password || !fromEmail) {
			console.warn('Email configuration incomplete');
			return null;
		}

		return {
			host,
			port: parseInt(port),
			username,
			password,
			fromEmail
		};
	} catch (error) {
		console.error('Error loading email config:', error);
		return null;
	}
}

export async function sendInvitationEmail(
	recipientEmail: string,
	teamName: string,
	invitationLink: string,
	invitedByName: string,
	isGeneralInvitation: boolean = false
): Promise<boolean> {
	try {
		const config = await getEmailConfig();
		if (!config) {
			console.error('Email configuration not available');
			return false;
		}

		const transporter = nodemailer.createTransport({
			host: config.host,
			port: config.port,
			secure: config.port === 465, // use TLS for 587, SSL for 465
			auth: {
				user: config.username,
				pass: config.password
			}
		});

		let htmlContent: string;
		let subject: string;

		if (isGeneralInvitation) {
			// General platform invitation
            htmlContent = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>You're invited to join Sentio</title>
    <!-- Preview text for many email clients -->
    <style>
      /* Ensure mobile-friendly email rendering */
      @media only screen and (max-width: 600px) {
        .container { padding: 20px !important; }
        .content { padding: 24px !important; }
        .hero { font-size: 20px !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:#f5f7fb; font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Liberation Sans', sans-serif; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;">
    <!-- Hidden preview text -->
    <div style="display:none;max-height:0px;overflow:hidden;mso-hide:all;">
      ${invitedByName} invited you to join a Mood Calendar — accept the invitation to get started.
    </div>

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" class="container" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background-color:#ffffff;border-radius:10px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(90deg,#0ea5ff 0%,#007bff 100%);padding:22px 24px;display:flex;align-items:center;gap:12px;">
                <!-- Simple inline logo -->
                <div style="width:40px;height:40px;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;color:#007bff;font-size:18px;">
                  Sentio
                </div>
                <div style="color:#fff;font-weight:600;font-size:16px;">Niko Niko Calendar</div>
              </td>
            </tr>

            <tr>
              <td class="content" style="padding:32px 48px 40px;">
                <h1 class="hero" style="margin:0 0 12px;font-size:24px;line-height:1.2;color:#0f172a;">
                  You're invited to join Niko Niko Calendar
                </h1>

                <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;">
                  <strong>${invitedByName}</strong> has invited you to join the platform and collaborate. Click the button below to accept the invitation and create your account.
                </p>

                <div style="text-align:center;margin:28px 0;">
                  <a href="${invitationLink}" role="button" aria-label="Accept invitation" style="background-color:#007bff;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;display:inline-block;font-weight:600;font-size:15px;">
                    Accept Invitation
                  </a>
                </div>

                <p style="margin:0 0 12px;color:#475569;font-size:13px;line-height:1.6;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>

                <p style="word-break:break-all;margin:0 0 20px;">
                  <a href="${invitationLink}" style="color:#0ea5ff;font-size:13px;">${invitationLink}</a>
                </p>

                <div style="background:#f1f5f9;border-radius:8px;padding:14px;color:#475569;font-size:13px;">
                  <p style="margin:0 0 6px;"><strong>What happens next?</strong></p>
                  <ul style="margin:6px 0 0;padding-left:18px;color:#475569;">
                    <li>Create your account or sign in.</li>
                    <li>You'll be added to the team (if this is a team invite).</li>
                    <li>The invitation expires in 7 days.</li>
                  </ul>
                </div>

                <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;">
                  Need help? Reply to this email or contact support at <strong>${config?.fromEmail ?? 'support@example.com'}</strong>.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 48px 28px;background:#f8fafc;color:#64748b;font-size:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
                  <div>© ${new Date().getFullYear()} Sentio</div>
                  <div style="color:#94a3b8;">This invitation was sent to <strong>${recipientEmail}</strong></div>
                </div>
              </td>
            </tr>
          </table>

          <!-- Small footer note for accessibility -->
          <div style="max-width:640px;margin-top:12px;color:#94a3b8;font-size:12px;">
            If you did not expect this invitation, you can ignore this email.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>
            `;
			subject = 'You\'re invited to join our platform';
		} else {
			// Team-specific invitation
			htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Team Invitation</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #333; margin-bottom: 20px;">You've been invited to join a team!</h2>
      
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        <strong>${invitedByName}</strong> has invited you to join <strong>${teamName}</strong> on our platform.
      </p>
      
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        Click the button below to accept the invitation:
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${invitationLink}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
          Accept Invitation
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px; line-height: 1.6;">
        Or copy and paste this link in your browser:<br>
        <a href="${invitationLink}" style="color: #007bff; word-break: break-all;">${invitationLink}</a>
      </p>
      
      <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
        This invitation will expire in 7 days.
      </p>
    </div>
  </body>
</html>
			`;
			subject = `You're invited to join ${teamName}`;
		}

		const result = await transporter.sendMail({
			from: config.fromEmail,
			to: recipientEmail,
			subject,
			html: htmlContent,
			text: `You've been invited to join. Visit this link to accept: ${invitationLink}`
		});

		console.log('Email sent:', result.messageId);
		return true;
	} catch (error) {
		console.error('Error sending email:', error);
		return false;
	}
}
