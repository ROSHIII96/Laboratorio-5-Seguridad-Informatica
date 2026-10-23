const Client = require("socket.io-client");
const { http } = require("../../server");

describe("Pruebas de Integración - Backend y una-lib (Socket.IO)", () => {
  let clientSocket;
  let serverAddress;

  beforeAll((done) => {
    // Iniciar el servidor HTTP en un puerto libre asignado por el SO (puerto 0)
    http.listen(0, () => {
      const port = http.address().port;
      serverAddress = `http://localhost:${port}`;
      // Conectar cliente Socket.IO
      clientSocket = Client(serverAddress);
      clientSocket.on("connect", done);
    });
  });

  afterAll((done) => {
    // Cerrar la conexión del cliente y el servidor HTTP
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    http.close(done);
  });

  test("URL de imagen válida: el backend acepta el mensaje y lo formatea", (done) => {
    const payload = JSON.stringify({
      nombre: "Joseth",
      mensaje: "https://ejemplo.com/foto.jpg",
      color: "#FF0000",
    });

    clientSocket.once("Evento-Mensaje-Server", (data) => {
      const res = JSON.parse(data);
      expect(res.nombre).toBe("Joseth");
      expect(res.mensaje).toContain("<img src=");
      expect(res.mensaje).toContain("https://ejemplo.com/foto.jpg");
      done();
    });

    clientSocket.emit("Evento-Mensaje-Server", payload);
  });

  test("URL de video válida: el backend acepta el mensaje y lo formatea como iframe de YouTube", (done) => {
    const payload = JSON.stringify({
      nombre: "Joseth",
      mensaje: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      color: "#00FF00",
    });

    clientSocket.once("Evento-Mensaje-Server", (data) => {
      const res = JSON.parse(data);
      expect(res.nombre).toBe("Joseth");
      expect(res.mensaje).toContain("<iframe");
      expect(res.mensaje).toContain("dQw4w9WgXcQ");
      done();
    });

    clientSocket.emit("Evento-Mensaje-Server", payload);
  });

  test("URL no permitida o script: la validación devuelve contenido saneado", (done) => {
    const payload = JSON.stringify({
      nombre: "Hacker",
      mensaje: "<script>alert('xss')</script>",
      color: "#0000FF",
    });

    clientSocket.once("Evento-Mensaje-Server", (data) => {
      const res = JSON.parse(data);
      expect(res.mensaje).not.toContain("<script>");
      expect(res.mensaje).toContain("&lt;script&gt;");
      expect(res.mensaje).toContain("&lt;/script&gt;");
      done();
    });

    clientSocket.emit("Evento-Mensaje-Server", payload);
  });
});
