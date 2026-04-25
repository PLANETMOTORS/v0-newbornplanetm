// Test script to trigger Live Video Tour booking email
const testBooking = async () => {
  const testData = {
    name: "Test User",
    email: "info@planetmotors.ca",
    phone: "416-555-1234",
    vehicleId: "test-vehicle-123",
    vehicleName: "2024 BMW X5 xDrive40i",
    preferredDate: "2026-04-07",
    preferredTime: "10:00",
    videoMethod: "google-meet",
    notes: "Test booking from v0"
  }

  console.log("Sending test booking request...")
  
  const response = await fetch("http://localhost:3000/api/live-video-tour/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(testData)
  })

  const result = await response.json()
  console.log(JSON.stringify({ status: response.status, ok: response.ok }))
  if (result && typeof result === 'object') {
    console.log(JSON.stringify({ sessionId: typeof result.sessionId === 'string' ? result.sessionId.slice(0, 8) + '…' : undefined, success: result.success }))
  }
}

testBooking()
