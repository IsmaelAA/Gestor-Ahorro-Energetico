const GestorConfiguracion = require('../modules/gestorConfiguracion');
const GestorSensores = require('../modules/gestorSensores');
const GestorRutinas = require('../modules/gestorRutinas');

/**
 * Crear una rutina con inicio, fin y días.
 */
test('Crear una rutina con inicio, fin y días.', () => {
  gestorSensores = new GestorSensores(new GestorConfiguracion());
  gestorRutinas = new GestorRutinas(gestorSensores);
  gestorRutinas.nuevaRutina("192.168.1.37","15:00","16:00",["1","2"])
  expect(gestorSensores.getSensores().find(sensor => sensor.device == "192.168.1.37").routines.length).toBe(1);
});

/**
 * Crear una rutina con solo inicio y fin.
 */
 test('Crear una rutina con solo inicio y fin.', () => {
  gestorSensores = new GestorSensores(new GestorConfiguracion());
  gestorRutinas = new GestorRutinas(gestorSensores);
  gestorRutinas.nuevaRutina("192.168.1.37","15:00","16:00")
  expect(gestorSensores.getSensores().find(sensor => sensor.device == "192.168.1.37").routines.length).toBe(2);
});

/**
 * Crear una rutina con un inicio mayor que el fin.
 */
 test('Crear una rutina con un inicio mayor que el fin.', () => {
  gestorSensores = new GestorSensores(new GestorConfiguracion());
  gestorRutinas = new GestorRutinas(gestorSensores);
  expect(() => gestorRutinas.nuevaRutina("192.168.1.37","16:00","15:00")).toThrow("La rutina no es coherente, debe empezar antes de que acabe.");
});

/**
 * Crear una rutina optimizada con numero horas >0 y <=24
 */
 test('Crear una rutina optimizada con numero horas >0 y <=24', () => {
  gestorSensores = new GestorSensores(new GestorConfiguracion());
  gestorRutinas = new GestorRutinas(gestorSensores);
  gestorRutinas.nuevaRutinaOptimizada("192.168.1.37",5)
  expect(gestorSensores.getSensores().find(sensor => sensor.device == "192.168.1.37").routines.length).toBe(7);
});

/**
 * Crear una rutina optimizada con numero horas <0
 */
 test('Crear una rutina optimizada con numero horas <0', () => {
  gestorSensores = new GestorSensores(new GestorConfiguracion());
  gestorRutinas = new GestorRutinas(gestorSensores);
 
  expect(() =>  gestorRutinas.nuevaRutinaOptimizada("192.168.1.37",-1)).toThrow();
});

/**
 * Crear una rutina optimizada con numero horas >24
 */
 test('Crear una rutina optimizada con numero horas >24', () => {
  gestorSensores = new GestorSensores(new GestorConfiguracion());
  gestorRutinas = new GestorRutinas(gestorSensores);
  expect(() =>  gestorRutinas.nuevaRutinaOptimizada("192.168.1.37",25)).toThrow();
});

/**
 * Eliminar las rutinas de un dispositivo que cuenta con rutinas.
 */
 test('Eliminar las rutinas de un dispositivo que cuenta con rutinas.', () => {
  gestorSensores = new GestorSensores(new GestorConfiguracion());
  gestorRutinas = new GestorRutinas(gestorSensores);
  gestorRutinas.eliminarRutinasDispositivo("192.168.1.37")
  expect(gestorSensores.getSensores().find(sensor => sensor.device == "192.168.1.37").routines.length).toBe(0);
});

/**
 * Eliminar las rutinas de un dispositivo que no cuenta con rutinas.
 */
 test('Eliminar las rutinas de un dispositivo que no cuenta con rutinas.', () => {
  gestorSensores = new GestorSensores(new GestorConfiguracion());
  gestorRutinas = new GestorRutinas(gestorSensores);
  gestorRutinas.eliminarRutinasDispositivo("192.168.1.37")
  expect(gestorSensores.getSensores().find(sensor => sensor.device == "192.168.1.37").routines.length).toBe(0);
});

/**
 * Eliminar las rutinas de un dispositivo que cuenta con rutinas y estas están funcionando.
 */
 test('Eliminar las rutinas de un dispositivo que cuenta con rutinas y estas están funcionando.', () => {
  gestorSensores = new GestorSensores(new GestorConfiguracion());
  gestorRutinas = new GestorRutinas(gestorSensores);
  gestorRutinas.iniciarRutinas("192.168.1.37")
  gestorRutinas.eliminarRutinasDispositivo("192.168.1.37")
  expect(gestorSensores.getSensores().find(sensor => sensor.device == "192.168.1.37").routines.length).toBe(0);
});

/**
 * Eliminar rutinas de un dispositivo que no existe en la base de datos.
 */
 test('Eliminar rutinas de un dispositivo que no existe en la base de datos.', () => {
  gestorSensores = new GestorSensores(new GestorConfiguracion());
  gestorRutinas = new GestorRutinas(gestorSensores);
  
  expect(() => gestorRutinas.eliminarRutinasDispositivo("192.168.1.99")).toThrow();
});