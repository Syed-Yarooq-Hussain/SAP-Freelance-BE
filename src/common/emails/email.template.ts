export const generalTemplate = (
  receiverName: string,
  message: string,
  senderName: string
) => `
  <div style="font-family: Arial; padding: 20px;">
    <p>Hello <b>${receiverName}</b>,</p>

    <p>${message}</p>

    <br/>

    <p>Best regards</p>
    <b>${senderName}</b>
  </div>
`;
