import { test, expect } from '@playwright/test';

test.describe('Pruebas End-to-End para UNA Chat', () => {

  test.beforeEach(async ({ page }) => {
    // Navegar a la página principal del chat antes de cada prueba
    await page.goto('/');
  });

  test('Caso 1: Enviar una URL de imagen y verificar que se muestra y carga', async ({ page }) => {
    // Usar una imagen pública estable que responde 200 OK
    const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png';

    // 1. Ingresar nombre y mensaje
    await page.getByPlaceholder('Username').fill('TesterImagen');
    await page.getByPlaceholder('Escriba un mensaje').fill(imageUrl);
    await page.getByRole('button', { name: 'Send' }).click();

    // 2. Localizar la imagen que el servidor genera dentro de #messages
    const imagen = page.locator('#messages img').last();

    // 3. Verificar que el elemento <img> aparece y es visible
    await expect(imagen).toBeVisible({ timeout: 10000 });
    await expect(imagen).toHaveAttribute('src', imageUrl);

    // 4. Verificar que la imagen terminó de cargar con éxito en el navegador (naturalWidth > 0)
    await expect.poll(async () => {
      return await imagen.evaluate((img) => img.complete && img.naturalWidth > 0);
    }, {
      message: 'La imagen debe terminar de cargarse correctamente en el navegador',
      timeout: 10000,
    }).toBeTruthy();
  });

  test('Caso 2: Enviar una URL de video y verificar que el reproductor aparece y carga', async ({ page }) => {
    const videoUrl = 'https://www.youtube.com/watch?v=qYwlqx-JLok';

    // 1. Ingresar nombre y enlace de video de YouTube
    await page.getByPlaceholder('Username').fill('TesterVideo');
    await page.getByPlaceholder('Escriba un mensaje').fill(videoUrl);
    await page.getByRole('button', { name: 'Send' }).click();

    // 2. Localizar el <iframe> que el servidor genera dentro de #messages
    const reproductor = page.locator('#messages iframe').last();

    // 3. Verificar que el reproductor iframe está presente y visible
    await expect(reproductor).toBeVisible({ timeout: 10000 });

    // 4. Verificar que el iframe apunta a la URL embed de YouTube correspondiente
    await expect(reproductor).toHaveAttribute('src', /https:\/\/www\.youtube\.com\/embed\/qYwlqx-JLok/);
  });

  test('Caso 3: Enviar script malicioso (XSS), registrar dialog y comprobar saneamiento', async ({ page }) => {
    const scriptMalicioso = '<script>alert("xss")</script>';
    let alertDisparado = false;
    let mensajeDialogo = '';

    // 1. Registrar el listener para page.on('dialog') ANTES de enviar el mensaje.
    // Si la aplicación tuviera la vulnerabilidad XSS, el navegador ejecutaría alert() y se activaría este evento.
    page.on('dialog', async (dialog) => {
      alertDisparado = true;
      mensajeDialogo = dialog.message();
      await dialog.dismiss(); // Cierra el alert para no bloquear el test
    });

    // 2. Enviar el payload malicioso
    await page.getByPlaceholder('Username').fill('Atacante');
    await page.getByPlaceholder('Escriba un mensaje').fill(scriptMalicioso);
    await page.getByRole('button', { name: 'Send' }).click();

    // 3. Esperar a que el mensaje aparezca en la lista del chat
    const ultimoMensaje = page.locator('#messages li').last();
    await expect(ultimoMensaje).toBeVisible();

    // 4. Validar que NO se disparó ningún alert()
    expect(alertDisparado, `Se disparó un alert con el mensaje: "${mensajeDialogo}". ¡Fallo de seguridad XSS!`).toBe(false);

    // 5. Verificar que el contenido fue sanitizado:
    // Debe mostrarse como texto plano seguro, pero no debe haber etiquetas <script> ejecutables en el DOM
    await expect(ultimoMensaje).toContainText('<script>alert("xss")</script>');
    await expect(page.locator('#messages script')).toHaveCount(0);
  });

});
