const GestorConfiguracion = require('../modules/gestorConfiguracion');
const GestorSensores = require('../modules/gestorSensores');

/**
 * Registro de nueva lectura de dispositivo(Nuevo sensor)
 */
test('Registro de nueva lectura de dispositivo(Nuevo sensor)', () => {
  gestorSensores = new GestorSensores(new GestorConfiguracion());
  gestorSensores.logLectura("192.168.0.99", 100, true);
  expect(gestorSensores.getSensores().find(sensor => sensor.device == "192.168.0.99")).not.toBeUndefined();
});

/**
 * Registro de nueva lectura de dispositivo(Sensor que ya se encuentra en la base de datos)'
 */
test('Registro de nueva lectura de dispositivo(Sensor que ya se encuentra en la base de datos)', () => {
  gestorSensores = new GestorSensores(new GestorConfiguracion());
  gestorSensores.logLectura("192.168.1.37", 100, true);
  expect(gestorSensores.getSensores().find(sensor => sensor.device == "192.168.1.37").readings.find(read => read.date == new Date().toLocaleString().split(' ')[0])).not.toBeUndefined();
});

/**
 * Registro de nueva lectura de dispositivo(Lectura negativa)
 */
test('Registro de nueva lectura de dispositivo(Lectura negativa)', () => {
  gestorSensores = new GestorSensores(new GestorConfiguracion());
  expect(() => gestorSensores.logLectura("192.168.0.99", -1, true)).toThrow("La lectura no puede ser negativa.")
});

/**
 * Eliminar las lecturas de un sensor que cuenta con lecturas.
 */
 test('Eliminar las lecturas de un sensor que cuenta con lecturas.', () => {
  gestorSensores = new GestorSensores(new GestorConfiguracion());
  gestorSensores.borrarLecturasDispositivo("192.168.1.37")
  expect(gestorSensores.getSensores().find(sensor => sensor.device == "192.168.1.37").readings.length).toBe(0);
});

/**
 * Eliminar las lecturas de un sensor que no cuenta con lecturas.
 */
 test('Eliminar las lecturas de un sensor que no cuenta con lecturas.', () => {
  gestorSensores = new GestorSensores(new GestorConfiguracion())
  gestorSensores.borrarLecturasDispositivo("192.168.1.37")
  expect(gestorSensores.getSensores().find(sensor => sensor.device == "192.168.1.37").readings.length).toBe(0);
});

/**
 * Eliminar las lecturas de un sensor que no existe en la base de datos.
 */
 test('Eliminar las lecturas de un sensor que no existe en la base de datos.', () => {
  gestorSensores = new GestorSensores(new GestorConfiguracion());
  expect(() => gestorSensores.borrarLecturasDispositivo("192.168.1.99")).toThrow()
});