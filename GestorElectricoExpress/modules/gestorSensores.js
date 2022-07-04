const request = require('request')
const fs = require('fs')

/**
 * Clase para la gestion de los dispositivos y sensores.
 */
class GestorSensores {

    sensors_readings = this.getSensores()
    gestorConfiguracion = null;
    timeout = 5000; // Timeout de 5 segundos

    constructor(gestorConfiguracion) {
        this.gestorConfiguracion = gestorConfiguracion;
    }

    /**
     * Devuelve los dispositivos almacenados en el sistema.
     * @returns sensors_readings
     */
    getSensores() {
        const json_sensors_readings = fs.readFileSync('sensors_readings.json', 'utf-8');
        var sensors = JSON.parse(json_sensors_readings);

        return sensors;
    }

    /**
     * Metodo auxiliar para determinar si se puede encender un dispositivo teniendo en cuenta la potencia del mismo.
     * @param {*} device dispositivo
     * @returns boolean
     */
    puedeEncender(device) {
        let totalWatt = this.sensors_readings.find(sensor => sensor.device == device).wattage;

        Object.keys(this.sensors_readings).forEach(function (sensorKey) {
            totalWatt += this.sensors_readings[sensorKey].wattage;
        }, this);

        if (totalWatt >= (this.gestorConfiguracion.getPotenciaContratada().homeWattage * 1000)) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * Metodo para encender el dispositivo pasado como parametro.
     * @param {*} device dispositivo
     */
    encenderDispositivo(device) {
        if (this.puedeEncender(device)) {
            var self = this;
            request('http://' + device + '/RELAY=ON', { timeout: this.timeout }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log("Encendido correctamente " + device)
                    self.sensors_readings.find(sensor => sensor.device == device).state = true;

                    // saving the array in a file
                    const json_sensors_readings = JSON.stringify(self.sensors_readings);
                    fs.writeFileSync('sensors_readings.json', json_sensors_readings, 'utf-8');
                } else {
                    console.log(error + "\tdevice: " + device);
                }
            });
        } else {
            throw "No se puede encender el dispositivo " + device + ", se supera la potencia contratada.";
        }
    }

    /**
     * Metodo para apagar el dispositivo pasado como parametro.
     * @param {*} device dispositivo
     */
    apagarDispositivo(device) {
        var self = this;
        request('http://' + device + '/RELAY=OFF', { timeout: this.timeout }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("Apagado correctamente " + device)

                self.sensors_readings.find(sensor => sensor.device == device).state = false;

                // saving the array in a file
                const json_sensors_readings = JSON.stringify(self.sensors_readings);
                fs.writeFileSync('sensors_readings.json', json_sensors_readings, 'utf-8');
            } else {
                console.log(error + "\tdevice: " + device);
            }
        });
    }

    /**
     * Metodo para cambiar la etiqueta identificativa del dispositivo pasado como parametro.
     * @param {*} device dispositivo
     * @param {*} tag etiqueta identificativa
     */
    cambiarTagDispositivo(device, tag) {
        if (this.sensors_readings.find(sensor => sensor.device == device) != undefined) {
            console.log("Cambiar tag del dispositivo " + device)
            this.sensors_readings.find(sensor => sensor.device == device).tag = tag;
        } else {
            throw "Error al cambiar tag del dispositivo " + device + " no encontrado";
        }

        // saving the array in a file
        const json_sensors_readings = JSON.stringify(this.sensors_readings);
        fs.writeFileSync('sensors_readings.json', json_sensors_readings, 'utf-8');
    }

    /**
     * Metodo para cambiar la potencia del dispositivo pasado como parametro.
     * @param {*} device dispositivo
     * @param {*} wattage potencia
     */
    cambiarPotenciaDispositivo(device, wattage) {
        if (wattage < 0) {
            throw "La potencia no puede ser negativa."
        }

        if (this.sensors_readings.find(sensor => sensor.device == device) != undefined) {
            console.log("Cambiar potencia del dispositivo " + device)
            this.sensors_readings.find(sensor => sensor.device == device).wattage = wattage;
        } else {
            throw "Error al cambiar potencia del dispositivo " + device + " no encontrado";
        }

        // saving the array in a file
        const json_sensors_readings = JSON.stringify(this.sensors_readings);
        fs.writeFileSync('sensors_readings.json', json_sensors_readings, 'utf-8');
    }

    /**
     * Metodo para borrar las lecturas registradas del dispositivo pasado como parametro.
     * @param {*} device dispositivo
     */
    borrarLecturasDispositivo(device) {
        if (this.sensors_readings.find(sensor => sensor.device == device) != undefined) {
            console.log("Borrando lecturas del dispositivo: " + device)
            this.sensors_readings.find(sensor => sensor.device == device).readings = [];
        } else {
            throw "Error al borrar lecturas del dispositivo " + device + " no encontrado";
        }

        // saving the array in a file
        const json_sensors_readings = JSON.stringify(this.sensors_readings);
        fs.writeFileSync('sensors_readings.json', json_sensors_readings, 'utf-8');
    }

    /**
     * Metodo para borrar todos los dispositivos de la base de datos.
     */
    reiniciarBD() {
        console.log("Reiniciar base de datos de sensores")
        this.sensors_readings = "[]";

        // saving the array in a file
        const json_sensors_readings = JSON.stringify(this.sensors_readings);
        fs.writeFileSync('sensors_readings.json', json_sensors_readings, 'utf-8');
    }

    /**
     * Metodo para registrar la lectura de un sensor en la base de datos.
     * Si no existe el dispositivo en la base de datos se crea uno nuevo.
     * Si ya existe el dispositivo se comprueba si es una lectura de un nuevo dia o no. 
     * En caso de serlo se crea una nueva lectura. 
     * Si no lo es se añade la lectura a los values del dispositivo.
     * @param {*} device dispositivo
     * @param {*} value valor de lectura
     * @param {*} state estado rele
     */
    logLectura(device, value, state) {
        if (value < 0) {
            throw "La lectura no puede ser negativa."
        }
        const fullDate = new Date().toLocaleString()
        const date = fullDate.split(' ')[0]
        const hour = fullDate.split(' ')[1]

        let kwHDay = (value / 1000) * (10 / 3600);
        let priceHour = (new Date().getHours()).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false }) + "-" + (new Date().getHours() + 1).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
        let dayCost = this.getPrecioHora(date, priceHour) * kwHDay;

        if (this.sensors_readings.find(sensor => sensor.device == device) != undefined) {
            console.log("Registro de nueva lectura del sensor: " + device + " - " + date)
            if (this.sensors_readings.find(sensor => sensor.device == device)['readings'].find(read => read.date == date) != undefined) {
                this.sensors_readings.find(sensor => sensor.device == device)['readings'].find(read => read.date == date).values.push({
                    value: parseFloat(value),
                    hour: hour
                });
                this.sensors_readings.find(sensor => sensor.device == device)['readings'].find(read => read.date == date).dayConsumption += kwHDay;
                this.sensors_readings.find(sensor => sensor.device == device)['readings'].find(read => read.date == date).dayCost += dayCost;
                this.sensors_readings.find(sensor => sensor.device == device).state = state != '0';
            } else {
                console.log("Registro de nueva lectura en nuevo dia del sensor: " + device + " - " + date)
                this.sensors_readings.find(sensor => sensor.device == device)['readings'].push({
                    date: date,
                    values: [{
                        value: parseFloat(value),
                        hour: hour
                    }],
                    dayConsumption: kwHDay,
                    dayCost: dayCost
                });
                this.sensors_readings.find(sensor => sensor.device == device).state = state != '0';
            }
        } else {
            console.log("Registro de nuevo sensor: " + device + " - " + date)
            this.sensors_readings.push({
                device: device,
                tag: "Dispositivo" + (this.sensors_readings.length),
                wattage: 0,
                state: state != '0',
                readings: [{
                    date: date,
                    values: [{
                        value: parseFloat(value),
                        hour: hour
                    }],
                    dayConsumption: kwHDay,
                    dayCost: dayCost
                }],
                runRoutines: false,
                routines: []
            });
        }
        // saving the array in a file
        const json_sensors_readings = JSON.stringify(this.sensors_readings);
        fs.writeFileSync('sensors_readings.json', json_sensors_readings, 'utf-8');
    }

    /**
     * Metodo axuliar para obtener el precio del kW/h para el dia y hora pasados como parametro.
     * @param {*} date dia
     * @param {*} hour hora
     * @returns Precio del kW/h para el dia y hora.
     */
    getPrecioHora(date, hour) {
        const json_precios_hora = fs.readFileSync('precios_hora.json', 'utf-8');
        var precios_hora = JSON.parse(json_precios_hora);
        var precioDia = precios_hora.find(precioDia => precioDia.date == date);

        if (precioDia != undefined) {
            return (precioDia.precios[hour].price / 1000).toFixed(4);
        } else {
            return 0;
        }
    }
}
// Exportar modulo.
module.exports = GestorSensores;