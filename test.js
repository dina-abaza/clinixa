const testBackup = async () => {
  const url = "https://script.google.com/macros/s/AKfycbwoi8x1AcBgYcgPuAWhMrfVYrqBEh7Ml2rDz-TTrg6HWC8kx8iGnulQiWPoSwMmsjyDNg/exec";
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secretKey: "Clinic_App_BkUp_98f7a2d4c8e1a3f6b5297130e4",
        fileName: "test_node.json",
        content: { status: "testing", message: "Node.js direct call" }
      }),
      redirect: 'follow'
    });

    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.error("Error:", err.message);
  }
};

testBackup();