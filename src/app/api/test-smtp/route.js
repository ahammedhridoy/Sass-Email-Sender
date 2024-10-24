import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    // Parse the FormData from the request body
    const formData = await req.formData();

    // Extract fields from FormData
    const host = formData.get("host");
    const port = formData.get("port");
    const smtpUser = formData.get("smtpUser");
    const password = formData.get("password");
    const secure = formData.get("secure") === "true"; // Convert string "true"/"false" to boolean
    const testMail = formData.get("testMail");

    // Create a transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      host: host,
      port: parseInt(port), // Ensure port is a number
      secure: secure,
      auth: {
        user: smtpUser,
        pass: password,
      },
    });

    // Define email options
    const mailOptions = {
      from: smtpUser, // Use smtpUser as the "from" address
      to: testMail,
      subject: "Test Mail Subject",
      text: "Test Mail Body",
    };

    // Send mail with defined transport object
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}
