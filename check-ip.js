async function checkIP() {
  try {
    console.log("Проверяем IP...");
    // Стучимся в сервис, который возвращает IP того, кто стучится
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    
    console.log("------------------------------------------------");
    console.log("ТВОЙ NODE.JS IP:", data.ip);
    console.log("------------------------------------------------");
    
    // Дополнительно проверим страну
    const geoRes = await fetch(`http://ip-api.com/json/${data.ip}`);
    const geoData = await geoRes.json();
    console.log("СТРАНА:", geoData.country);
    console.log("ГОРОД:", geoData.city);
    
  } catch (e) {
    console.error("Ошибка проверки IP:", e.message);
  }
}

checkIP();