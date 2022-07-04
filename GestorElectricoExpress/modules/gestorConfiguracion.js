const fs = require('fs')

/**
 * Clase encargada de la gestion de la configuracion del sistema, actualmente solo incluye la potencia contratda.
 */
class GestorConfiguracion {

    constructor() {
        this.home_wattage = this.getPotenciaContratada();
    }

    /**
     * Metodo para cambiar la potencia contratada del sistema.
     * @param {*} nuevaPotencia nueva potencia contratada
     */
    cambiarPotenciaContratada(nuevaPotencia) {
        this.home_wattage = nuevaPotencia;

        // saving the array in a file
        const json_home_wattage = JSON.stringify(this.home_wattage);
        fs.writeFileSync('home_wattage.json', json_home_wattage, 'utf-8');
    }

    /**
     * Devuelve la potencia contratada.
     * @returns home_wattage
     */
    getPotenciaContratada() {
        const json_home_wattage = fs.readFileSync('home_wattage.json', 'utf-8');
        return JSON.parse(json_home_wattage);
    }
}

module.exports = GestorConfiguracion;