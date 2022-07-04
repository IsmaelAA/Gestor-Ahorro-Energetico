/**
 * Rutas de /configuracion
 * @param {*} app 
 * @param {*} gestorSensores 
 * @param {*} gestorConfiguracion 
 */
module.exports = function (app, gestorSensores, gestorConfiguracion) {

    /**
     * Pagina configuración.
     */
    app.get('/configuracion', (req, res) => {
        try {
            sensors_readings = gestorSensores.getSensores();
            home_wattage = gestorConfiguracion.getPotenciaContratada();
            res.render('pages/configuration', { sensores: sensors_readings, potenciaContratada: home_wattage })
        } catch (err) {
            res.status(400).render('pages/error', { error: err });
        }
    });

    /**
     * Establecer la potencia contratada en el hogar.
     */
    app.post('/configuracion/setPotenciaContratada', (req, res) => {
        const { homeWattage } = req.body;

        if (!homeWattage) {
            res.status(400).render('pages/error', { error: "Entries must have a homeWattage" });
            return;
        }

        try {
            nuevaPotencia = { homeWattage: parseFloat(homeWattage) }
            gestorConfiguracion.cambiarPotenciaContratada(nuevaPotencia);
            res.redirect('/configuracion');
        } catch (err) {
            res.status(400).render('pages/error', { error: err });
        }
    });
}