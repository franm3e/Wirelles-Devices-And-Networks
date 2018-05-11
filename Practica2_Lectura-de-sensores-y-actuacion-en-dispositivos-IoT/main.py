
# Francisco Martínez Esteso

#TODO:
#código en MicroPython necesario para la realización de la práctica.

import pycom
import time
from pysense import Pysense
from SI7006A20 import SI7006A20 # humedad y temperatura
from LTR329ALS01 import LTR329ALS01 # luminosidad

py = Pysense()
li = LTR329ALS01(py)
si = SI7006A20(py)

pycom.heartbeat(False)
pycom.rgbled(0xf0000)  # Pongo el LED a rojo

while True:
    # Obtenemos valores
    temperatura = si.temperature()
    luminosidad = li.light()
    # Lo imprimimos por consola
    print("Temperatura: %d, Luminosidad: %d" % (temperatura, luminosidad[0]));

    # Comprobamos luminosidad y oscilamos LED
    if luminosidad[0] > 50:
        pycom.rgbled(0x000000) # Pongo el LED a negro
    else:
        pycom.rgbled(0xff0000) # Pongo el LED a rojo

    # Ejecuto el main cada segundo
    time.sleep(1)
