const request = require('request')
const fs = require('fs')

/**
 * Clase para la gestion de los precios del kW/h almacenados en el sistema.
 */
class GestorPrecios {

    precios_hora = this.getPrecios();
    gestorRutinas = null;

    timeout = 5000; // Timeout de 5 segundos

    constructor(gestorRutinas) {
        this.gestorRutinas = gestorRutinas;
    }

    /**
     * Funcion para guardar los precios del dia en la base de datos(precios_hora.json) y asi poder recuperarlos.
     */
    logPreciosHora() {
        var self = this;
        request('https://api.preciodelaluz.org/v1/prices/all?zone=PCB', { timeout: this.timeout }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let precios = JSON.parse(response.body.toString());
                let date = new Date().toLocaleString().split(' ')[0];
                console.log('Log Precios hora del dia ' + date + ' statusCode:', response && response.statusCode);

                if (self.precios_hora.find(precio => precio.date == date)) return false; // Si ya tenemos registro de eses día no volver a guardar.

                let max = Number.MIN_VALUE;
                let maxHour = ""
                let min = Number.MAX_VALUE;
                let minHour = ""
                let media = 0;

                Object.keys(precios).forEach(function (key) {
                    media += precios[key].price
                    if (precios[key].price > max) {
                        max = precios[key].price
                        maxHour = key
                    }
                    if (precios[key].price < min) {
                        min = precios[key].price
                        minHour = key
                    }
                }, this);

                self.precios_hora.push({
                    date: date,
                    precios: precios,
                    max: {
                        hour: maxHour,
                        price: max
                    },
                    min: {
                        hour: minHour,
                        price: min
                    },
                    average: (media / 24).toFixed(2)
                });

                // saving the array in a file
                const json_precios_hora = JSON.stringify(self.precios_hora);
                fs.writeFileSync('precios_hora.json', json_precios_hora, 'utf-8');

                try {
                    gestorRutinas.actualizarRutinas(); // Actualizar las rutinas optimizadas a los nuevos precios
                } catch (err) {
                    console.log(err);
                }
            } else {
                console.log(error)
            }
        });
    };

    /**
     * Devuelve los precios almacenados en el sistema.
     * @returns precios_hora
     */
    getPrecios() {
        const json_precios_hora = fs.readFileSync('precios_hora.json', 'utf-8');
        var precios_hora = JSON.parse(json_precios_hora);
        return precios_hora;
    }

}
// Exportar modulo.
module.exports = GestorPrecios;