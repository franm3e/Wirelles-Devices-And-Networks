# -*- coding: utf-8 -*-

# Francisco Martínez Esteso

# LIBRERIAS
from pysense import Pysense
from network import WLAN
import _thread
from SI7006A20 import SI7006A20 # humedad y temperatura
from LTR329ALS01 import LTR329ALS01 # luminosidad
import machine
import time
import pycom
from mqtt import MQTTClient

# WIFI
# Función que gestiona las operaciones de búsqueda y conexión a una red WIFI
def wifiOn():
    wlan = WLAN(mode=WLAN.STA)
    nets = wlan.scan() #        Scan en busca de redes

    for net in nets: #      Para cada red (switch)
        # WIFI CASA 2
        if net.ssid == 'xxyy':
            print('Red encontrada!   xxyy')
            wlan.connect(net.ssid, auth=(net.sec, 'xxxx'), timeout=5000) #        Omito contraseña
            while not wlan.isconnected():
                machine.idle() # save power while waiting
                print("Intentado conectar...")
                time.sleep(5)
            print('WLAN conexion establecida!   xxyy')
            break
        # WIFI CASA
        if net.ssid == 'xxyy':
            print('Red encontrada!   xxyy')
            wlan.connect(net.ssid, auth=(net.sec, 'xxxx'), timeout=5000) #        Omito contraseña
            while not wlan.isconnected():
                machine.idle() # save power while waiting
                print("Intentado conectar...")
                time.sleep(5)
            print('WLAN conexion establecida!   xxyy')
            break
        # WIFI UCLM
        if net.ssid == 'eduroam':
            print('Red encontrada!   eduroam')
            wlan.connect(net.ssid, auth=(net.sec, 'xxxx@alu.uclm.es', 'xxxx'), identity='xxxx', timeout=5000) #        Omito usuario, contraseña e identidad
            while not wlan.isconnected():
                machine.idle() # save power while waiting
                print("Intentado conectar...")
                time.sleep(5)
            print('WLAN conexion establecida!   eduroam')
            break

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
            client.publish(topic="/sensores/luminosidad", msg=str(luminosidad[0]))
            client.publish(topic="/sensores/temperatura", msg=str(temperatura))

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

        client.subscribe(topic="/modo/estado")
        client.subscribe(topic="/modo/manual/estado")
        client.subscribe(topic="/led/color")

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

    # Modo (AUTO):
    if topic == b'/modo/estado':
        msg = msg.decode('ascii')
        if(msg == "true"):
            modo = "auto"
            print("Modo     AUTO")
        else:
            modo = "manual"
            pycom.rgbled(0x000000) # Pongo el LED a negro
            print("Modo     MANUAL")

    # Estado LED (ON/OFF):
    if topic == b'/modo/manual/estado':
        msg = msg.decode('ascii')
        if(msg == "true"):
            pycom.rgbled(0xff0000)
            print("El LED cambia su estado a:   ENCENDIDO")

        else:
            pycom.rgbled(0x000000)
            print("El LED cambia su estado a:   APAGADO")

    # Color LED:
    if topic == b'/led/color':
        pycom.rgbled(int(msg, 16))
        msg = msg.decode('ascii')
        print("El LED cambia su color a:   " + msg)

# MAIN
# Función principal encargada de la conexión al servidor y la ejecución de hilos
def main():
    pycom.heartbeat(False) #        Quito parpadeo
    pycom.rgbled(0x000000)

    wifiOn()

    client = MQTTClient("cliente", "192.168.1.200", port=1883) #        CAMBIAR IP POR LA DEL SERVIDOR ACTUAL
    client.settimeout = settimeout
    client.set_callback(callback_function)
    client.connect()
    print("Conectado al servidor:    192.168.1.200")

    pycom.rgbled(0x05ff16) #        Mostramos un led verde para indicar que la conexión se realizó adecuadamente
    time.sleep(2) #     Durante dos segundos
    pycom.rgbled(0x000000) #        Apagamos la luz verde

    _thread.start_new_thread(thread_sensores, (client, "thread_sensores", 1, )) #       Hilo sensores
    _thread.start_new_thread(thread_config, (client, "thread_config",)) #       Hilo config


if __name__ == "__main__":
    modo = "" #     Atributo global modo (AUTO/MANUAL)
    main() 
