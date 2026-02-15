import qrcode
from PIL import Image, ImageDraw, ImageFont

def generar_qr_con_titulo(texto_qr, nombre_archivo, titulo):
    # 1. Generar el código QR básico
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(texto_qr)
    qr.make(fit=True)
    img_qr = qr.make_image(fill_color="black", back_color="white").convert('RGB')

    # 2. Configurar el lienzo para agregar el texto
    ancho, alto = img_qr.size
    # Le sumamos 50 píxeles extra de altura para el título
    nueva_altura = alto + 50
    imagen_final = Image.new('RGB', (ancho, nueva_altura), 'white')
    
    # Pegar el QR en la nueva imagen (dejando espacio arriba)
    imagen_final.paste(img_qr, (0, 50))

    # 3. Dibujar el texto
    draw = ImageDraw.Draw(imagen_final)
    
    # Intentar cargar una fuente, si no usa la de defecto
    try:
        # En Windows la ruta suele ser esta:
        fuente = ImageFont.truetype("arial.ttf", 25)
    except:
        fuente = ImageFont.load_default()

    # Centrar el texto
    # bbox devuelve (izquierda, arriba, derecha, abajo)
    left, top, right, bottom = draw.textbbox((0, 0), titulo, font=fuente)
    ancho_texto = right - left
    pos_x = (ancho - ancho_texto) / 2
    
    # Dibujar el título arriba (podes cambiar el color a tu gusto)
    draw.text((pos_x, 10), titulo, fill="black", font=fuente)

    # 4. Guardar
    imagen_final.save(nombre_archivo)
    print(f"Código QR con título generado como: {nombre_archivo}")

# Uso para tu torneo en Río Cuarto
mi_contenido = "https://portaltorneos-riocuarto.com.ar/"
mi_titulo = "Scaneame e inscribite!!"
archivo_salida = "Inscripcionmixto.png"

generar_qr_con_titulo(mi_contenido, archivo_salida, mi_titulo)