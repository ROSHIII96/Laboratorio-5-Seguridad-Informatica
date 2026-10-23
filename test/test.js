var val = require('../libs/unalib');
var assert = require('assert');

describe('unalib', function(){

  describe('funcion is_valid_phone', function(){
    it('deberia devolver true para 8297-8547', function(){
      assert.equal(val.is_valid_phone('8297-8547'), true);
    });

    it('deberia devolver false para 8297p-8547', function(){
      assert.equal(val.is_valid_phone('8297p-8547'), false);
    });
  });

  describe('Validacion y despliegue de URLs de Imagenes', function(){
    it('deberia devolver true para http://image.com/image.jpg', function(){
      assert.equal(val.is_valid_url_image('http://image.com/image.jpg'), true);
    });

    it('deberia devolver true para http://image.com/image.gif', function(){
      assert.equal(val.is_valid_url_image('http://image.com/image.gif'), true);
    });

    it('deberia devolver true para formato png https://sitio.com/foto.png', function(){
      assert.equal(val.is_valid_url_image('https://sitio.com/foto.png'), true);
    });

    it('deberia devolver false para URLs que no son imagenes (ej. PDF o texto plano)', function(){
      assert.equal(val.is_valid_url_image('https://sitio.com/archivo.pdf'), false);
      assert.equal(val.is_valid_url_image('Hola esto no es una imagen'), false);
    });

    it('deberia mostrar la imagen correctamente generando el tag <img> en validateMessage', function(){
      var raw = JSON.stringify({ nombre: "Joseth", mensaje: "https://sitio.com/foto.png" });
      var res = JSON.parse(val.validateMessage(raw));
      assert.equal(res.mensaje, '<img src="https://sitio.com/foto.png" style="max-height: 400px;max-width: 400px;">');
    });
  });

  describe('Validacion y despliegue de URLs de Videos', function(){
    it('deberia devolver true para https://www.youtube.com/watch?v=qYwlqx-JLok', function(){
      assert.equal(val.is_valid_yt_video('https://www.youtube.com/watch?v=qYwlqx-JLok'), true);
    });

    it('deberia devolver true para enlaces cortos de YouTube https://youtu.be/qYwlqx-JLok', function(){
      assert.equal(val.is_valid_yt_video('https://youtu.be/qYwlqx-JLok'), true);
    });

    it('deberia devolver false para URLs que no son de YouTube o texto cualquiera', function(){
      assert.equal(val.is_valid_yt_video('https://vimeo.com/123456'), false);
      assert.equal(val.is_valid_yt_video('Mensaje normal sin video'), false);
    });

    it('deberia integrar adecuadamente el reproductor <iframe> en validateMessage', function(){
      var raw = JSON.stringify({ nombre: "Joseth", mensaje: "https://www.youtube.com/watch?v=qYwlqx-JLok" });
      var res = JSON.parse(val.validateMessage(raw));
      var esperado = '<iframe width="560" height="315" src="https://www.youtube.com/embed/qYwlqx-JLok" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
      assert.equal(res.mensaje, esperado);
    });
  });

  describe('Prevencion de Inyeccion de Scripts (XSS)', function(){
    it('deberia escapar etiquetas <script>', function(){
      var malicious = '<script>alert("xss")</script>';
      var expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;';
      assert.equal(val.sanitize(malicious), expected);
    });

    it('deberia sanitizar el mensaje en validateMessage para neutralizar inyecciones de scripts', function(){
      var raw = JSON.stringify({ nombre: "Hacker", mensaje: "<script>alert(1)</script>" });
      var res = JSON.parse(val.validateMessage(raw));
      assert.equal(res.mensaje, '&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    it('deberia bloquear intentos de inyeccion con vectores como <img onerror>', function(){
      var raw = JSON.stringify({ nombre: "Hacker", mensaje: '<img src=x onerror="alert(1)">' });
      var res = JSON.parse(val.validateMessage(raw));
      assert.equal(res.mensaje.includes('<img'), false);
      assert.equal(res.mensaje.includes('&lt;img'), true);
    });

    it('deberia sanitizar el nombre de usuario si contiene scripts maliciosos', function(){
      var raw = JSON.stringify({ nombre: '<script>alert("admin")</script>', mensaje: "Hola mundo" });
      var res = JSON.parse(val.validateMessage(raw));
      assert.equal(res.nombre, '&lt;script&gt;alert(&quot;admin&quot;)&lt;/script&gt;');
    });
  });

});
