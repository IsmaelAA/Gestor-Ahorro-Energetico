const express = require('express')
const app = express()
const port = 3000

var ip = require("ip");

// View Engine EJS
app.set('view engine', 'ejs');
app.set("layout extractScripts", true);

// Declaro la carpeta public.
app.use(express.static('public'));

//Declarar icono de la aplicacion.
var favicon = require('serve-favicon')
app.use(favicon(__dirname + '/public/img/favicon.ico'));

// Body Parser para soportar parametros en POST
var bodyParser = require('body-parser')
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}))

/**
 * GestorConfiguracion
 */
const GestorConfiguracion = require('./modules/gestorConfiguracion');
gestorConfiguracion = new GestorConfiguracion();

/**
 * GestorSensores
 */
const GestorSensores = require('./modules/gestorSensores');
gestorSensores = new GestorSensores(gestorConfiguracion);

/**
 * GestorRutinas
 */
const GestorRutinas = require('./modules/gestorRutinas');
gestorRutinas = new GestorRutinas(gestorSensores);

/**
 * GestorPrecios
 */
const GestorPrecios = require('./modules/gestorPrecios');
gestorPrecios = new GestorPrecios(gestorRutinas);

//Imports de las rutas.
require("./routes/rsensores")(app, gestorSensores, gestorPrecios);
require("./routes/rrutinas")(app, gestorSensores, gestorPrecios, gestorRutinas);
require("./routes/rinformes")(app, gestorSensores, gestorPrecios);
require("./routes/rconfiguracion")(app, gestorSensores, gestorConfiguracion);

/**
 * Pagina por defecto (sensores)
 */
app.get('/', (req, res) => {
    res.redirect("/sensores");
});

/**
 * Manejo de excepciones
 */
app.use((req, res, next) => {
    res.status(404).send("<h1>Page not found on the server</h1>");
});

app.listen(port, () => {
    console.log(`App funcionando en http://${ip.address()}:${port}/`)
});

const routinesInterval = 10000;
const preciosInterval = new Date().setHours(24, 0, 0, 0) - Date.now();

/**
 * Funcion para ejecutar una vez al inciarse el servidor, en ella se definen las funciones que se tienen que repetir por intervalos.
 */
function run() {
    gestorRutinas.runRoutines();
    // Ejecutar una vez cada 10 segundos.
    setInterval(function () { gestorRutinas.runRoutines(); }, routinesInterval);
  
    gestorPrecios.logPreciosHora();
    // Ejecutar una vez al día.
    setInterval(function () { gestorPrecios.logPreciosHora(); },preciosInterval);
}

// Ejecutar una vez al iniciar el servidor.
run();