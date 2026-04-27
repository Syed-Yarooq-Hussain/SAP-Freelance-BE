export const generalTemplate = (
  receiverName: string,
  message: string,
  senderName: string
) => `
  <div style="font-family: Arial; padding: 20px;">
    <p>Hello,</p>

    <p>${message}</p>

    <br/>

    <p>Best regards</p>
    <b>${senderName}</b>
  </div>
`;


export const verifyEmailTemplate = (
  receiverName: string,
  verifyLink: string
) => `
  <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f4f6f8;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 24px; border-radius: 6px;">
      
      <h2 style="color: #333;">Verify My Email</h2>

      <p>Hello,</p>

      <p style="color:#555; line-height:1.6;">
        You have requested email verification for your SAP Freelance Portal account.
        To complete the verification process, please click on the button below.
      </p>

      <div style="margin: 24px 0;">
        <a 
          href="${verifyLink}"
          style="
            background-color: #007bff;
            color: #ffffff;
            padding: 12px 20px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;
          "
        >
          Verify Email
        </a>
      </div>

      <p style="color:#777; font-size: 13px;">
        If you did not request email verification, feel free to ignore this email.
      </p>

      <br/>

      <p>Best regards,</p>
      <b>SAP Freelance Portal</b>
    </div>
  </div>
`;


export const resetPasswordTemplate = (
  resetLink: string
) => `
  <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f4f6f8;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 24px; border-radius: 6px;">

      <h2 style="color:#333;">Reset Your Password</h2>

      <p>Hi,</p>

      <p style="color:#555; line-height:1.6;">
        We received a request to reset the password for your account on SAP Freelance Portal.
      </p>

      <p style="color:#555;">
        Click the button below to set a new password:
      </p>

      <div style="margin: 24px 0;">
        <a
          href="${resetLink}"
          style="
            background-color: #007bff;
            color: #ffffff;
            padding: 12px 20px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;
          "
        >
          Reset Password
        </a>
      </div>

      <p style="color:#777; font-size:13px;">
        For security reasons, this link will expire in 15 minutes.
      </p>

      <p style="color:#777; font-size:13px;">
        If you did not request a password reset, please ignore this email.
      </p>

      <br/>
      <b>SAP Freelance Portal</b>
    </div>
  </div>
`;
