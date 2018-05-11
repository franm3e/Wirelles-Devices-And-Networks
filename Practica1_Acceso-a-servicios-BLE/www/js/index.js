/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

//var UPDATING_TIME = 5000; //Update interval for scanning device

// Francisco Martínez Esteso

var app = {};
var device_id_global;

app.KnownDevices = {}; //Array of visible LightBlue-Bean devices.
    
// Application Constructor
app.initialize = function() {
    document.addEventListener('deviceready',
			      app.onDeviceReady,
			      false);
};

// deviceready Event Handler
//
// Bind any cordova events here. Common events are:
// 'pause', 'resume', etc.
app.onDeviceReady = function() {
	
    app.receivedEvent('deviceready');
    app.iniDOM();
    app.startScan();
};

// Update DOM on a Received Event
app.receivedEvent = function(id) {
    console.log('Received Event: ' + id);
};
    
    
//Initialize the web document.
//
// Show found device list section
// Hide device connected section
app.iniDOM = function(){
    $('#deviceList').children().remove();
    $("#scanning").show();
    //Hide "bean_connected" div
    $("#connected").hide();	
};


//Create a new DOM element for a LightBlue-Bean device
app.updateDOM=function(device){
    var device_id = device.id.replace(/:/g,'');
    var $a = $('<span class="name">'+device.name+ '</span>'+
    	       '<input id="'+device_id+'" type=image src="./img/on.png" width="32" heigh="32" style="vertical-align:middle">'+
               '<br><span class="data"> ID: '+device.id+'</span>');
    var li = document.createElement('li');
    $(li).addClass('list-group-item');
    if(String(device.name) == "undefined"){
        $(li).addClass('list-group-item-danger');
        $(li).addH
    }
    if(String(device.name) == "LightBlueBean-1"){
        $(li).addClass('list-group-item-success');
    }
    $(li).append($a);
    var $button = $("#"+device_id);
    $a.bind("click",
    	    {device : device},
    	    app.Connect);
    var p = document.getElementById('deviceList');
    p.appendChild(li);
//    $("#deviceList").listview("refresh");
};

     
//Change DOM to show the connected page of the device with address and name specify
//
// params:
//	peripheral: Object which contains info about connected  device

app.showDOMconnect = function(peripheral){
    //Update DOM with device information
    console.log("in ShowDOMconnect2");
    document.getElementById('deviceName').innerHTML = peripheral.name;
    document.getElementById('deviceAddress').innerHTML = peripheral.id;
    	
    document.getElementById('deviceState').innerHTML = 'Connected';
    //Set up a disconnection button
    var $button = $('input[id="disconnect_button"]');
    $button.bind("click",
    		 {peripheral : peripheral},
    		 app.Disconnect);
    $("#scanning").hide();
    $("#connected").show();    		 
};


//Update DOM with battery level
//
// params:
//    buffer: a Buffer with battery level in the most significant byte
app.updateBatteryDOM = function(buffer){
    //Update DOM with temperature reading
    var data = new Uint8Array(buffer);
    document.getElementById('Battery').innerHTML=data[0];
},


//Update DOM with temperature value
//
// params:
//    buffer: a Buffer with temperature value in the most significant byte
app.updateTempDOM = function(buffer){
    //Update DOM with temperature reading
    var data = new Uint8Array(buffer);
    document.getElementById('temperature').innerHTML=data[0];
},


//Update DOM with RGB values
//
// params:
//   buffer: a Buffer with RGB values in the three most significant byte respectively
app.updateLEDsDOM = function(buffer){
    //Update DOM
    var data = new Uint8Array(buffer);
    $("#redLed").val(data[0]);
    $("#greenLed").val(data[1]);
    $("#blueLed").val(data[2]);
};


// Read RGB values from DOM and sent them to device
app.LedUpdate = function(){
    /* 
     *  1.- Read RGB values from DOM
     *  2.- Send RGB values to device
     */

    //Read RGB Values
    var red = $("#redLed").val();
    var green  = $("#greenLed").val();
    var blue = $("#blueLed").val();
    
    //Send values to device
    app.sendLEDUpdate(red,green,blue);
};


/******************************************
*
* Methods to be implement by students
*
*******************************************/
    	
//Start scanning for BLE devices
app.startScan = function(){
    /* TODO:
        * Esta función deberá:
        * 	1.- Inicializar el array de dispositivos descubiertos app.KnownDevices.
        * 	2.- Comenzar a buscar dispositivos
        *          2.1.- Por cada dispositivo LightBlueBean encontrado actualizar DOM -> llamar función app.updateDOM(device)
        *                Todos los dispositivos LightBlueBean tienen una MAC que comienza por C4:BE:84...
        */

    // 1, 2 
    ble.startScan([],function(device) {
                        // 2.1
                        app.updateDOM(device);
                    }, 
                    function() { 
                        console.log("Hubo un error al escanear los dispositivos.");
                    });
};
    
app.Connect = function(event){
    /* TODO
     * Esta función debe:
     * 	    1.- Para el escaneo de dispositivos
     * 	    2.- Conectarse al dispositivo cuya address y name se pasa en event.
     * 	         2.1.- Mostrar el DOM de conexión (app.showDOMconnect(device))
     *           2.2.- Llamar a la función de lectura de nivel de batería (app.setBatteryLevel(device))
     *           2.3.- Llamar a la función de lectura de la temperatura (app.setUpTemp (device))
     *           2.4.- Llamar a la función de inicialización de los LEDs (app.setUpLEDs(device))

     */

    // 1
    ble.stopScan(function(device){
                    console.log("Detenido escaneo de dispositivos con exito.");
                },   
                function(device){
                    console.log("Hubo un error al detener el escaneo de dispositivos.");
                });
    // 2
    ble.connect(event.data.device.id,
                function(device) {
                    // x
                    device_id_global = event.data.device.id;
                    console.log("Conectado a " + device.name);
        		    // 2.1
                    app.showDOMconnect(event.data.device);
                    // 2.2
                    app.setBatteryLevel(event.data.device);
                    // 2.3
                    app.setUpTemp (event.data.device);
                    // 2.4
                    app.setUpLEDs(event.data.device);
                },
                function(device){
                    console.log("Hubo un error al conectarse al dispositivo " + device.name)
                });
 
};


//Set up notification of battery measurement.
app.setBatteryLevel = function(peripheral){
    /* TODO
     * Establecer la lectura automática de la batería mediante la activiación de notificaciones.
     * Para ello hay que:
     * 	1.- Leer el valor de nivel de batería
     * 	2.- Establecer la notificación de la batería
     * 
     * Para actualizar el valor del nivel de batería en el DOM hay que llamar a la función app.updateBatteryDOM
     * Los UUID del servicio y característica para la bateria son:
     * 
     *                              service_uuid                       characteristic_uuid
     *                  |--------------------------------------|---------------------------------------|                
     *  Battery Level   | 0000180F-0000-1000-8000-00805f9b34fb | UUID Estandar (buscar en Internet)    |
     *                  |--------------------------------------|---------------------------------------| 
     */
    
    // 1
    ble.read(peripheral.id, "0000180F-0000-1000-8000-00805f9b34fb", "2A19", function(device){
									app.updateBatteryDOM(device);
									}, function(device){
										console.log("Hay un error al leer el nivel de bateria")
									});
	
    // 2
    ble.startNotification(peripheral.id, "0000180F-0000-1000-8000-00805f9b34fb", "2A19", function(device){
                                                    app.updateBatteryDOM(device);
                                                }, function(device){
                                                    console.log("Error al activar las notificaciones para la bateria.")
                                                });
};


//Set up notification of temperature measurement.
app.setUpTemp = function(peripheral){
    /* TODO
     * Establecer la lectura automática de la temperatura mediante la activiación de notificaciones.
     * Para ello hay que:
     * 	1.- Establecer la notificación de la misma. 
     *  
     * Cada vez que se actualice el valor de la temperatura habrá que actualizar el DOM llamando a la función app.updateTempDOM
     * 
     * Los UUID del servicio y característica para la temperatura son:
     * 
     *                              service_uuid                       characteristic_uuid
     *              |--------------------------------------|---------------------------------------|                
     *  Temperature | a495ff20-c5b1-4b44-b512-1370f02d74de | a495ff22-c5b1-4b44-b512-1370f02d74de  |
     *              |--------------------------------------|---------------------------------------| 
     */
    
     // 1
     ble.startNotification(peripheral.id, "a495ff20-c5b1-4b44-b512-1370f02d74de", "a495ff22-c5b1-4b44-b512-1370f02d74de", 
                                                                                                function(device){
                                                                                                    app.updateTempDOM(device);
                                                                                                }, function(device){
                                                                                                       console.log("Error al activar las notificaciones para la temperatura.")
                                                                                                });
};

	

app.setUpLEDs = function(peripheral){
    /* TODO
     * 	1.- Obtiene el valor de los LEDs del dispositivo.
     *  2.- Actualizar el DOM con el valor obtenido de los LEDs: call function app.updateLEDsDOM
     *  
     * Valor de los UUIDs del servicio y la característica asociado a los LEDs
     *                              service_uuid                       characteristic_uuid
     *              |--------------------------------------|--------------------------------------|
     *  LED         | a495ff20-c5b1-4b44-b512-1370f02d74de | a495ff21-c5b1-4b44-b512-1370f02d74de |
     *              |--------------------------------------|--------------------------------------| 
     */

     // 1
     ble.read(peripheral.id, "a495ff20-c5b1-4b44-b512-1370f02d74de", "a495ff21-c5b1-4b44-b512-1370f02d74de", 
													function(device){
														app.updateLEDsDOM(device);
														console.log("Actualizado el color de los leds.");
													}, function(device){
														console.log("Hay un error al leer el valor de los leds.");
													});

};


// Send RGB values to device for update LED color
// parameter
//    rgb (UInt8Array): array of integer [red,green,blue]
app.sendLEDUpdate = function(red,green,blue){
    /* TODO
     *   Escribir el valor de rgb en el servicio y característica asociado al LED:
     *  
     *                              service_uuid                       characteristic_uuid
     *              |--------------------------------------|--------------------------------------|
     *  LED         | a495ff20-c5b1-4b44-b512-1370f02d74de | a495ff21-c5b1-4b44-b512-1370f02d74de |
     *              |--------------------------------------|--------------------------------------| 
     */
     // 1
     var data = new Uint8Array(3);
     data[0] = red;
     data[1] = green;
     data[2] = blue;
     ble.write(device_id_global, "a495ff20-c5b1-4b44-b512-1370f02d74de", "a495ff21-c5b1-4b44-b512-1370f02d74de", data.buffer, 
                                                                                        function(device){
                                                                                        console.log("Se ha cambiado el color de los led.");
                                                                                        }, function(device){
                                                                                        console.log("Error al cambiar el color de los led.");
                                                                                        });
};

    


app.Disconnect = function(event){
    /* TODO
     *    1.- Disconnect from deviceHanle
     *    2.- Inicializar DOM: call method iniDOM()
     *    3.- Restart scanning
     */

    //1
    ble.disconnect(event.data.peripheral.id, function(device){
                                    console.log("Desconectado con exito de " + event.data.peripheral.name);
                                }, 
                                function(device){
                                    console.log("Hubo un error al desconectar del dispositivo" + event.data.peripheral.name);                  
                                });
    //2
    app.iniDOM();
    //3
    app.startScan();
};



