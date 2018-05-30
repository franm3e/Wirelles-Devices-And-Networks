# -*- coding: utf-8 -*-

# LIBRERIAS
from pysense import Pysense
from network import WLAN
import _thread
from SI7006A20 import SI7006A20 # humedad y temperatura
from LTR329ALS01 import LTR329ALS01 # luminosidad
import machine
import time
import pycom
import ujson
from mqtt import MQTTClient

# Francisco Martinez Esteso

# WIFI
# Función que gestiona las operaciones de búsqueda y conexión a una red WIFI
def wifiOn():
    wlan = WLAN(mode=WLAN.STA)

    # WIFI UCLMIOT
    print('Red encontrada!   uclmiot')
    wlan.connect("uclmiot", auth=(WLAN.WPA2, "xxyy"), timeout=5000)
    print('WLAN conexion establecida!   uclmiot')


# THREAD SENSORES
# Función hilo que gestiona la obtención de valores de luminosidad y temperatura y su registro
def thread_sensores(client, threadName, delay):
    try:
        print("Ejecutando:  " + threadName)

        py = Pysense()
        li = LTR329ALS01(py)
        si = SI7006A20(py)

        pycom.heartbeat(False)
        pycom.rgbled(0x000000)  # Pongo el LED a rojo para encenderlo

        while True:

            global modo

            # Obtenemos valores
            temperatura = si.temperature()
            luminosidad = li.light()
            # Lo imprimimos por consola
            # print("Temperatura: %d, Luminosidad: %d" % (temperatura, luminosidad[0]));

            # (retain=False, qos=0)
            client.publish(topic="iot-2/evt/luminosidad/fmt/json", msg=str(luminosidad[0]))
            client.publish(topic="iot-2/evt/temperatura/fmt/json", msg=str(temperatura))

            if(modo == "auto"):
                # Comprobamos luminosidad y oscilamos LED
                if luminosidad[0] > 50:
                    pycom.rgbled(0x000000) # Pongo el LED a negro
                else:
                    pycom.rgbled(0xff0000) # Pongo el LED a rojo

            # Ejecuto el main cada dos segundo
            time.sleep(delay)

    except Exception as e:
        print("Excepcion:   " + str(e))

# THREAD CONFIG
# Función hilo que gestiona el control del dashboard y los modos
def thread_config(client, threadName):
    try:
        print("Ejecutando:  " + threadName)

        client.subscribe(topic="iot-2/cmd/topic/fmt/json")

        while True:
            client.check_msg() #        Siempre comprobando si recibimos algún mensaje nuevo y lo gestionamos en el callback

    except Exception as e:
        print("Excepcion:   " + str(e))


def settimeout(duration):
    pass

# CALLBACK FUNCTION
# Función ejecutada al recibir un nuevo mensaje en cualquiera de los topic a los que estamos subscritos
def callback_function(topic, msg):

    global modo
    global json_global
    print(msg)
    json_global = ujson.loads(msg)
    print(json_global["color"])

    # Modo (AUTO):
    if(json_global["estado"]):
        modo = "auto"
        print("Modo     AUTO")

    else:
        modo = "manual"
        print("Modo     MANUAL")

        # Estado LED (ON/OFF):
        if(json_global["led"]):
            pycom.rgbled(0xff0000)
            print("El LED cambia su estado a:   ENCENDIDO")
            # Evitamos que de error cuando nos devuelve el color #000000 al volver del estado auto.
            if(json_global["color"] != "#000000"):
                pycom.rgbled(int(json_global["color"],16))

        else:
            pycom.rgbled(0x000000)
            print("El LED cambia su estado a:   APAGADO")


# MAIN
# Función principal encargada de la conexión al servidor y la ejecución de hilos
def main():

    pycom.heartbeat(False) #        Quito parpadeo
    pycom.rgbled(0x000000)

    wifiOn()

    client = MQTTClient('d:89g41g:pycom:device_py', '89g41g.messaging.internetofthings.ibmcloud.com', user='use-token-auth', password='xxyy', port=1883) #        CAMBIAR IP POR LA DEL SERVIDOR ACTUAL
    client.set_callback(callback_function)
    client.connect()
    print("Conectado al servidor:    89g41g.internetofthings.ibmcloud.com")

    pycom.rgbled(0x05ff16) #        Mostramos un led verde para indicar que la conexión se realizó adecuadamente
    time.sleep(2) #     Durante dos segundos
    pycom.rgbled(0x000000) #        Apagamos la luz verde

    _thread.start_new_thread(thread_sensores, (client, "thread_sensores", 5, )) #       Hilo sensores
    _thread.start_new_thread(thread_config, (client, "thread_config",)) #       Hilo config


if __name__ == "__main__":

    json_global = {}
    json_global["estado"] = False
    json_global["led"] =  False
    json_global["color"] = "000000"
    modo = "manual" #     Atributo global modo (AUTO/MANUAL)

    main()
