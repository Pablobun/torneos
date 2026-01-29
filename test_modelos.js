// test_modelos.js
// REEMPLAZA "TU_API_KEY" CON TU CLAVE REAL DE GOOGLE
const apiKey = "AIzaSyAuD9LgxZGn0lLTFIuaUCXs8-1I1ch0zTg"; 

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log("Consultando modelos disponibles en Google...");

fetch(url)
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      console.error("Error de API:", data.error.message);
    } else {
      console.log("\n--- MODELOS DISPONIBLES PARA TI ---");
      // Filtramos solo los que sirven para generar texto (generateContent)
      const modelosTexto = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
      modelosTexto.forEach(model => {
        // El nombre viene como "models/gemini-pro", lo limpiamos para mostrarte qué poner
        console.log(`Nombre para usar: "${model.name.replace("models/", "")}"`);
      });
      console.log("-----------------------------------");
    }
  })
  .catch(err => console.error("Error de conexión:", err));