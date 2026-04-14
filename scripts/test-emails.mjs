import { Resend } from 'resend'

const resend = new Resend(process.env.API_KEY_RESEND || process.env.RESEND_API_KEY)
const ADMIN_EMAIL = 'toni@planetmotors.ca'
const FROM_EMAIL = 'Planet Motors <notifications@planetmotors.ca>'

const testEmails = [
  {
    subject: '[TEST] New Finance Application - John Smith',
    html: '<div style="font-family:Arial;max-width:600px;margin:0 auto;"><h2 style="color:#1e40af;">New Finance Application</h2><p><strong>Customer:</strong> John Smith</p><p><strong>Email:</strong> john@test.com</p><p><strong>Phone:</strong> (416) 555-0123</p><p><strong>Vehicle:</strong> 2024 BMW X5</p><p><strong>Application ID:</strong> FA-TEST-001</p><p style="margin-top:20px;padding:15px;background:#f0f9ff;border-radius:8px;">This is a test email from Planet Motors.</p></div>'
  },
  {
    subject: '[TEST] Trade-In Quote Request - Jane Doe',
    html: '<div style="font-family:Arial;max-width:600px;margin:0 auto;"><h2 style="color:#1e40af;">Trade-In Quote Request</h2><p><strong>Customer:</strong> Jane Doe</p><p><strong>Email:</strong> jane@test.com</p><p><strong>Phone:</strong> (416) 555-0456</p><p><strong>Vehicle:</strong> 2020 Honda Accord</p><p><strong>Estimated Value:</strong> $18,500</p><p style="margin-top:20px;padding:15px;background:#f0f9ff;border-radius:8px;">This is a test email from Planet Motors.</p></div>'
  },
  {
    subject: '[TEST] Test Drive Request - Mike Johnson',
    html: '<div style="font-family:Arial;max-width:600px;margin:0 auto;"><h2 style="color:#1e40af;">Test Drive Request</h2><p><strong>Customer:</strong> Mike Johnson</p><p><strong>Email:</strong> mike@test.com</p><p><strong>Phone:</strong> (416) 555-0789</p><p><strong>Vehicle:</strong> 2024 Mercedes GLE</p><p><strong>Preferred Date:</strong> Tomorrow at 2:00 PM</p><p style="margin-top:20px;padding:15px;background:#f0f9ff;border-radius:8px;">This is a test email from Planet Motors.</p></div>'
  },
  {
    subject: '[TEST] Vehicle Inquiry - Sarah Williams',
    html: '<div style="font-family:Arial;max-width:600px;margin:0 auto;"><h2 style="color:#1e40af;">Vehicle Inquiry</h2><p><strong>Customer:</strong> Sarah Williams</p><p><strong>Email:</strong> sarah@test.com</p><p><strong>Phone:</strong> (416) 555-0321</p><p><strong>Vehicle:</strong> 2023 Audi Q7</p><p><strong>Message:</strong> Is this vehicle still available? What financing options do you offer?</p><p style="margin-top:20px;padding:15px;background:#f0f9ff;border-radius:8px;">This is a test email from Planet Motors.</p></div>'
  },
  {
    subject: '[TEST] Price Alert Subscription - Tom Brown',
    html: '<div style="font-family:Arial;max-width:600px;margin:0 auto;"><h2 style="color:#1e40af;">Price Alert Subscription</h2><p><strong>Customer:</strong> Tom Brown</p><p><strong>Email:</strong> tom@test.com</p><p><strong>Vehicle:</strong> 2024 Toyota RAV4</p><p><strong>Current Price:</strong> $42,500</p><p><strong>Alert:</strong> Customer wants to be notified of any price drops.</p><p style="margin-top:20px;padding:15px;background:#f0f9ff;border-radius:8px;">This is a test email from Planet Motors.</p></div>'
  }
]

async function runTests() {
  console.log('Starting email tests...')
  console.log('Sending to:', ADMIN_EMAIL)
  console.log('')
  
  let success = 0
  let failed = 0
  
  for (const email of testEmails) {
    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: email.subject,
        html: email.html,
      })
      
      if (error) {
        console.log('FAILED:', email.subject)
        console.log('Error:', JSON.stringify(error))
        failed++
      } else {
        console.log('SENT:', email.subject)
        success++
      }
    } catch (err) {
      console.log('ERROR:', email.subject)
      console.log('Error:', err.message)
      failed++
    }
  }
  
  console.log('')
  console.log('=== RESULTS ===')
  console.log('Success:', success)
  console.log('Failed:', failed)
  console.log('')
  console.log('Check your inbox at', ADMIN_EMAIL)
}

runTests()
