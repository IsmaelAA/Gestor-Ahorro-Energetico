/**
 * Rutas de /rutinas
 * @param {*} app 
 * @param {*} gestorSensores 
 * @param {*} gestorPrecios 
 * @param {*} gestorRutinas 
 */
module.exports = function (app, gestorSensores, gestorPrecios, gestorRutinas) {

    /**
     * Pagina rutinas
     */
    app.get('/rutinas', (req, res) => {
        try {
            sensors_readings = gestorSensores.getSensores();
            precios_hora = gestorPrecios.getPrecios();
            res.render('pages/routines', { sensores: sensors_readings, precios: precios_hora })
        } catch (err) {
            res.status(400).render('pages/error', { error: err });
        }
    });

    /**
     * Borrar todas las rutinas, borrando todas las entradas en el json.
     */
    app.get("/rutinas/reiniciar", function (req, res) {
        console.log("Petición de Reiniciar todas las rutinas")

        try {
            gestorRutinas.reiniciarRutinas();
            res.redirect(req.get('referer'));
        } catch (err) {
            res.status(400).render('pages/error', { error: err });
        }
    });

    /**
     * Nueva rutina para el dispositivo pasado como parametro.
     */
    app.post("/rutinas/nueva", function (req, res) {
        const { device, start, end, days } = req.body;
        console.log("Peticion de nueva rutina para " + device)

        if (!device || !start || !end) {
            res.status(400).render('pages/error', { error: "Entries must have a start and end" });
            return;
        }

        try {
            gestorRutinas.nuevaRutina(device, start, end, days);
            res.redirect(req.get('referer'));
        } catch (err) {
            res.status(400).render('pages/error', { error: err });
        }
    });


    /**
     * Nueva rutina optimizada para el dispositivo en funcion de las horas pasadas como parametro.
     */
    app.post("/rutinas/optimizar", function (req, res) {
        const { device, hoursActivated } = req.body;
        console.log("Peticion de rutina optimizada para " + device + " con numero de horas: " + hoursActivated)

        if (!hoursActivated || !device) {
            res.status(400).render('pages/error', { error: "Entries must have a device and number of hours" });
            return;
        }

        try {
            gestorRutinas.nuevaRutinaOptimizada(device, hoursActivated);
            res.redirect(req.get('referer'));
        } catch (err) {
            res.status(400).render('pages/error', { error: err });
        }
    });


    /**
     * Inicia las rutinas de un dispositivo pasado por parametro en la URL.
     */
    app.get("/rutinas/iniciar/:device", function (req, res) {
        const device = req.params.device;
        console.log("Peticion de iniciar rutinas para " + device)

        if (!device) {
            res.status(400).render('pages/error', { error: "Entries must have a device" });
            return;
        }

        try {
            gestorRutinas.iniciarRutinas(device);
            res.redirect(req.get('referer'));
        } catch (err) {
            res.status(400).render('pages/error', { error: err });
        }
    });

    /**
     * Detiene las rutinas de un dispositivo.
     */
    app.get("/rutinas/detener/:device", function (req, res) {
        const device = req.params.device;
        console.log("Peticion de detener rutinas para " + device)

        if (!device) {
            res.status(400).render('pages/error', { error: "Entries must have a device" });
            return;
        }
        
        try {
            gestorRutinas.detenerRutinas(device);
            res.redirect(req.get('referer'));
        } catch (err) {
            res.status(400).render('pages/error', { error: err });
        }
    });

    /**
     * Elimina las rutinas de un dispositivo.
     */
    app.get("/rutinas/restablecer/:device", function (req, res) {
        const device = req.params.device;
        console.log("Peticion de eliminar rutinas para " + device)

        if (!device) {
            res.status(400).render('pages/error', { error: "Device not defined" });
            return;
        }

        try {
            gestorRutinas.eliminarRutinasDispositivo(device);
            res.redirect(req.get('referer'));
        } catch (err) {
            res.status(400).render('pages/error', { error: err });
        }
    })
}