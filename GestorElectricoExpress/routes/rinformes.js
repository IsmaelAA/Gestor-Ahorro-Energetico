/**
 * Rutas de /informes
 * @param {*} app 
 * @param {*} gestorSensores 
 * @param {*} gestorPrecios 
 */
module.exports = function (app, gestorSensores, gestorPrecios) {

    /**
     * Pagina informes
     */
    app.get('/informes', (req, res) => {
        try {
            sensors_readings = gestorSensores.getSensores();
            precios_hora = gestorPrecios.getPrecios();

            res.render('pages/reports', { sensores: sensors_readings, precios: precios_hora })
        } catch (err) {
            res.status(400).render('pages/error', { error: err });
        }
    });
}