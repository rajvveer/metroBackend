// utils/sendotp.js
const twilio = require("twilio");

// Load Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_NUMBER;

// Check that all required credentials are provided
if (!accountSid || !authToken || !twilioNumber) {
  console.error("Twilio credentials are missing in the environment variables.");
}

const client = twilio(accountSid, authToken);

/**
 * Sends an OTP via Twilio SMS service.
 * @param {string} phone - The recipient's phone number in E.164 format (e.g., +911234567890).
 * @param {string} otp - The OTP to send to the recipient.
 * @returns {Promise<string>} - Returns the SID of the sent message on success.
 * @throws {Error} - Throws an error if sending the OTP fails.
 */
const sendOtp = async (phone, otp) => {
  try {
    // Ensure the phone number is in E.164 format
    if (!phone.startsWith("+")) {
      throw new Error("Phone number must be in E.164 format (e.g., +911234567890).");
    }

    // Send the OTP message
    const message = await client.messages.create({
      body: `Your OTP is ${otp}. It is valid for 5 minutes.`,
      from: twilioNumber,
      to: phone,
    });

    console.log(`OTP sent to ${phone}: ${message.sid}`);
    return message.sid; // Return the message SID for logging/debugging
  } catch (error) {
    console.error(`Failed to send OTP to ${phone}:`, error.message);
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
};

module.exports = sendOtp;
