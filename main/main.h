// main.h
#ifndef _MAIN_H
#define _MAIN_H

const String loggerURL = "http://" + serverIP + "/sensores/log";
long start_time = millis();
const int refreshTime = 10000;

int tensionRed = 230;
// ACS712 Constants
const int sensorACS712 = A0;
int mVA = 85; // la sensibilidad del fabricante es 100 mV/A, pero se ha ajustado a 85.
double Voltage = 0;
double VRMS = 0;
double AmpsRMS = 0;
float offset = 0.100;



// Rele Constants
const int relay = 4;
bool state = false;
#endif
