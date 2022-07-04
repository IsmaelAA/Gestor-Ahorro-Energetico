const fs = require('fs');

/**
 * Clase para la gestion de las rutinas de los dispositivos.
 */
class GestorRutinas {
    gestorSensores = null;
    sensors_readings = gestorSensores.sensors_readings;

    constructor(gestorSensores) {
        this.gestorSensores = gestorSensores;
    }

    /**
     * Función para ejecutar las rutinas de los dispositivos.
     */
    runRoutines() {
        let self = this;
        Object.keys(self.sensors_readings).forEach(function (key) {
            if (self.sensors_readings[key].runRoutines && self.sensors_readings[key].routines.length > 0) {

                let currentTime = new Date();
                let currentDay = new Date().getDay();
                let routineRunning = false;


                Object.keys(self.sensors_readings[key].routines).forEach(function (routineKey) {
                    let rstart = self.sensors_readings[key].routines[routineKey].start.split(':')
                    let rend = self.sensors_readings[key].routines[routineKey].end.split(':')

                    let dstart = new Date().setHours(rstart[0], rstart[1])
                    let dend = new Date().setHours(rend[0], rend[1])

                    if (currentTime >= dstart
                        && currentTime <= dend
                        && (self.sensors_readings[key].routines[routineKey].days == undefined || self.sensors_readings[key].routines[routineKey].days.find(d => d == currentDay))
                        && !routineRunning) {
                        console.log("Rutina de encendido de " + self.sensors_readings[key].device +
                            " - Inicio: " + self.sensors_readings[key].routines[routineKey].start +
                            " - Fin: " + self.sensors_readings[key].routines[routineKey].end +
                            " - Días: " + self.sensors_readings[key].routines[routineKey].days)

                        if (!self.sensors_readings[key].state) {
                            try {                             
                                self.gestorSensores.encenderDispositivo(self.sensors_readings[key].device);
                            } catch (err) {
                                console.log(err);
                            }
                        }
                        routineRunning = true
                    }
                }, self);

                if (!routineRunning) {
                    console.log("Rutina de apagado de " + self.sensors_readings[key].device)
                    if (self.sensors_readings[key].state) {
                        try {
                            self.gestorSensores.apagarDispositivo(self.sensors_readings[key].device);
                        } catch (error) {
                            console.log(error);
                        }
                    }
                }
            }
        }, self)
    }

    /**
     * Creacion de nueva rutina para el dispositivo pasado como parametro, con start, end y opcionalmente days.
     * @param {*} device dispositivo
     * @param {*} start inicio rutina
     * @param {*} end fin rutina
     * @param {*} days dias rutina
     */
    nuevaRutina(device, start, end, days) {
        let rstart = start.split(':');
        let rend = end.split(':');

        let dstart = new Date().setHours(rstart[0], rstart[1])
        let dend = new Date().setHours(rend[0], rend[1])

        if (dstart >= dend) {
            throw "La rutina no es coherente, debe empezar antes de que acabe.";
        }

        if (this.sensors_readings.find(sensor => sensor.device == device) != undefined) {
            console.log("Nueva rutina " + device)
            this.sensors_readings.find(sensor => sensor.device == device).routines.push({
                isOptimized: false,
                start: start,
                end: end,
                days: days
            });
        } else {
            throw "Error al añadir rutina al dispositivo " + device + " no encontrado";
        }

        // saving the array in a file
        const json_sensors_readings = JSON.stringify(this.sensors_readings);
        fs.writeFileSync('sensors_readings.json', json_sensors_readings, 'utf-8');
    }

    /**
     * Creacion de nueva rutina optimizada para el dispositivo pasado como parametro, con hoursActivated.
     * @param {*} device dispositivo
     * @param {*} hoursActivated horas activado
     */
    nuevaRutinaOptimizada(device, hoursActivated) {
        const json_precios_hora = fs.readFileSync('precios_hora.json', 'utf-8');
        let precios_hora = JSON.parse(json_precios_hora);

        if(hoursActivated <1 || hoursActivated >24){
            throw "Error al crear rutina optimizada para el dispositivo " + device + ", el numero de horas tiene que estar entre 1 y 24";
        }

        if (this.sensors_readings.find(sensor => sensor.device == device) != undefined) {
            console.log("Nueva rutina optimizada " + device)

            let assignedHours = [];
            let preciosHoraDia = precios_hora[[precios_hora.length - 1]].precios;

            for (let i = 0; i < hoursActivated; i++) {
                let lowestHour = "";
                let lowestPrice = Number.MAX_VALUE;

                Object.keys(preciosHoraDia).forEach(function (hora) {

                    if (preciosHoraDia[hora].price < lowestPrice && !assignedHours.includes(String(preciosHoraDia[hora].hour))) {
                        lowestHour = preciosHoraDia[hora].hour;
                        lowestPrice = preciosHoraDia[hora].price;
                    }
                }, this);
                assignedHours.push(lowestHour);
            }

            let newRoutines = []
            assignedHours.forEach(function (horaAsignada) {
                if (horaAsignada.split("-")[1] == "24") {
                    newRoutines.push(
                        {
                            isOptimized: true,
                            start: horaAsignada.split("-")[0] + ":00",
                            end: "00:00",
                        }
                    );
                } else {
                    newRoutines.push(
                        {
                            isOptimized: true,
                            start: horaAsignada.split("-")[0] + ":00",
                            end: horaAsignada.split("-")[1] + ":00",
                        }
                    );
                }

            }, this);

            Object.keys(this.sensors_readings.find(sensor => sensor.device == device).routines).forEach(function (rutinaKey) {
                if (!this.sensors_readings.find(sensor => sensor.device == device).routines[rutinaKey].isOptimized) {
                    newRoutines.push(this.sensors_readings.find(sensor => sensor.device == device).routines[rutinaKey])
                }
            }, this)

            this.sensors_readings.find(sensor => sensor.device == device).routines = newRoutines;
        } else {
            throw "Error al añadir rutina al dispositivo " + device + " no encontrado";
        }

        // saving the array in a file
        const json_sensors_readings = JSON.stringify(this.sensors_readings);
        fs.writeFileSync('sensors_readings.json', json_sensors_readings, 'utf-8');
    }

    /**
    * Función para actualizar las rutinas optimizadas cuando entran los precios de un nuevo dia. 
    * De esta forma las rutinas optimizadas siempre tienen los precios/hora mas bajos del día.
    */
    actualizarRutinas() {
        Object.keys(this.sensors_readings).forEach(function (sensorKey) {
            let optimizedHours = 0;

            Object.keys(this.sensors_readings[sensorKey].routines).forEach(function (routineKey) {
                if (this.sensors_readings[sensorKey].routines[routineKey].isOptimized) {
                    optimizedHours++;
                }
            }, this);

            if (optimizedHours > 0) {
                console.log("Peticion de actualizar rutinas optimizadas para el dispositivo " + this.sensors_readings[sensorKey].device)
                this.nuevaRutinaOptimizada(this.sensors_readings[sensorKey].device, optimizedHours);
            }
        }, this);
    }

    /**
     * Funcion para iniciar la ejecucion de rutinas de un dispositivo.
     * @param {*} device dispositivo
     */
    iniciarRutinas(device) {
        if (this.sensors_readings.find(sensor => sensor.device == device) != undefined) {
            this.sensors_readings.find(sensor => sensor.device == device).runRoutines = true;
            console.log("Estado de rutinas de " + device + " : " + true)
        } else {
            throw "Error al iniciar rutinas del dispositivo " + device + " no encontrado."
        }

        // saving the array in a file
        const json_sensors_readings = JSON.stringify(this.sensors_readings);
        fs.writeFileSync('sensors_readings.json', json_sensors_readings, 'utf-8');
    }

    /**
     * Funcion para detener la ejecucion de rutinas de un dispositivo.
     * @param {*} device dispositivo
     */
    detenerRutinas(device) {
        if (this.sensors_readings.find(sensor => sensor.device == device) != undefined) {
            this.sensors_readings.find(sensor => sensor.device == device).runRoutines = false;
            console.log("Estado de rutinas de " + device + " : " + false)
        } else {
            throw "Error al detener rutinas del dispositivo " + device + " no encontrado."
        }

        // saving the array in a file
        const json_sensors_readings = JSON.stringify(this.sensors_readings);
        fs.writeFileSync('sensors_readings.json', json_sensors_readings, 'utf-8');
    }

    /**
     * Funcion para eliminar las rutinas de un dispositivo.
     * @param {*} device dispositivo
     */
    eliminarRutinasDispositivo(device) {
        if (this.sensors_readings.find(sensor => sensor.device == device) != undefined) {
            this.sensors_readings.find(sensor => sensor.device == device).routines = [];
        } else {
            throw "Error al eliminar rutinas del dispositivo " + device + " no encontrado."
        }

        // saving the array in a file
        const json_sensors_readings = JSON.stringify(this.sensors_readings);
        fs.writeFileSync('sensors_readings.json', json_sensors_readings, 'utf-8');
    }

    /**
     * Funcion para eliminar todas las rutinas de todos los dispositivos.
     */
    reiniciarRutinas() {
        Object.keys(this.sensors_readings).forEach(function (key) {
            this.sensors_readings[key].routines = []
        }, this);

        // saving the array in a file
        const json_sensors_readings = JSON.stringify(this.sensors_readings);
        fs.writeFileSync('sensors_readings.json', json_sensors_readings, 'utf-8');
    }
}
// Exportar modulo.
module.exports = GestorRutinas;





