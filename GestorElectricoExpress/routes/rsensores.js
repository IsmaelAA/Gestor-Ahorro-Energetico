/**
 * Rutas de /sensores
 * @param {*} app 
 * @param {*} gestorSensores 
 * @param {*} gestorPrecios 
 */
module.exports = function (app, gestorSensores, gestorPrecios) {

    /**
     * Pagina sensores
     */
    app.get('/sensores', (req, res) => {
        try {
            sensors_readings = gestorSensores.getSensores();
            precios_hora = gestorPrecios.getPrecios();

            res.render('pages/index', { sensores: sensors_readings, precios: precios_hora })
        } catch (err) {
            res.status(400).render('pages/error', { error: err });
        }
    });

    /**
     * Pagina lecturas del dispositivo pasado como parametro en la URL.
     */
    app.get('/sensores/:device', (req, res) => {
        const device = req.params.device;

        if (!device) {
            res.status(400).render('pages/error', { error: "Las peticiones deben contener device" });
            return;
        }

        try {
            sensors_readings = gestorSensores.getSensores();
            sensor = sensors_readings.find(sensor => sensor.device == device);
            if(sensor == undefined){
                throw "No se tienen registros del dispositivo " + device
            }
            precios_hora = gestorPrecios.getPrecios();

            res.render('pages/readings', { sensor: sensor, precios: precios_hora })
        } catch (err) {
            res.status(400).render('pages/error', { error: err });
        }
    });

    /**
     * Encender el dispositivo pasado pasado en la url.
     */
    app.get("/sensores/encender/:device", function (req, res) {
        const device = req.params.device;
        console.log("Peticion de Encender " + device)

        if (!device) {
            res.status(400).render('pages/error', { error: "Las peticiones deben contener device" });
            return;
        }

        try {
            gestorSensores.encenderDispositivo(device);
            res.redirect(req.get('referer'));
        } catch (err) {
            console.log(err);
            res.status(400).render('pages/error', { error: err });
        }
    });

    /**
     * Apagar el dispositivo pasado en la url.
     */
    app.get("/sensores/apagar/:device", function (req, res) {
        const device = req.params.device;
        console.log("Peticion de Apagar " + device)

        if (!device) {
            res.status(400).render('pages/error', { error: "Las peticiones deben contener device" });
            return;
        }

        try {
            gestorSensores.apagarDispositivo(device);
            res.redirect(req.get('referer'));
        } catch (err) {
            res.status(400).render('pages/error', { error: err });
        }
    });

    /**
     * Cambiar tag del dispositivo
     */
    app.post("/sensores/setTag", function (req, res) {
        const { device, tag } = req.body;
        console.log("Peticion de Cambiar tag del dispositivo " + device)

        if (!device || !tag) {
            res.status(400).render('pages/error', { error: "Las peticiones deben contener device and tag" });
            return;
        }

        try {
            gestorSensores.cambiarTagDispositivo(device, tag);
            res.redirect(req.get('referer'));
        } catch (err) {
            res.status(400).render('pages/error', { error: err });
        }
    });

    /**
     * Cambiar potencia del dispositivo
     */
    app.post("/sensores/setPotencia", function (req, res) {
        const { device, wattage } = req.body;
        console.log("Peticion de Cambiar la potencia del dispositivo " + device)

        if (!device || !wattage) {
            res.status(400).render('pages/error', { error: "Las peticiones deben contener device and wattage" });
            return;
        }

        try {
            gestorSensores.cambiarPotenciaDispositivo(device, parseFloat(wattage));
            res.redirect(req.get('referer'));
        } catch (err) {
            res.status(400).render('pages/error', { error: err });
        }
    });

    /**
     * Borrar todas las lecturas del sensor pasado como parametro en la url.
     */
    app.get("/sensores/borrarLecturas/:device", function (req, res) {
        const device = req.params.device;
        console.log("Peticion de borrar las lecturas del dispositivo " + device)

        if (!device) {
            res.status(400).render('pages/error', { error: "Las peticiones deben contener device" });
            return;
        }

        try {
            gestorSensores.borrarLecturasDispositivo(device);
            res.redirect(req.get('referer'));
        } catch (err) {
            res.status(400).render('pages/error', { error: err });
        }
    });

    /**
     * Reiniciar la base de datos de sensores, borrando todas las entradas en el json.
     */
    app.get("/sensores/reiniciar", function (req, res) {
        console.log("Peticion de reiniciar la base de datos")

        try {
            gestorSensores.reiniciarBD();
            res.redirect(req.get('referer'));
        } catch (err) {
            res.status(400).render('pages/error', { error: err });
        }
    });


    /**
     * Registrar nueva lectura de un sensor.
     */
    app.post("/sensores/log", function (req, res) {
        const { device, value, state } = req.body;
        console.log("Peticion de registro de lectura de datos del sensor: " + device)

        if (!device || !value || !state) {
            res.status(400).render('pages/error', { error: "Las peticiones deben contener device, value and state" });
            return;
        }
        try {
            gestorSensores.logLectura(device, value, state);
            res.sendStatus(200);
        } catch (err) {
            res.status(400).render('pages/error', { error: err });
        }
    });
}