
#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>

#include "config.h"
#include "main.h"

ESP8266WebServer server(80);

/**
   @brief

*/
void setup()
{
  // PIN
  pinMode(sensorACS712, INPUT);
  pinMode(relay, OUTPUT);
  state = false;
  Serial.begin(115200);

  Serial.println();

  for (uint8_t t = 4; t > 0; t--)
  {
    Serial.printf("[SETUP] WAIT %d...\n", t);
    Serial.flush();
    delay(1000);
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(mySSID, myPassword);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  // Set server routing
  restServerRouting();
  // Set not found response
  server.onNotFound(handleNotFound);

  // Start the server
  server.begin();

  // Print the IP address
  Serial.print("Use this URL to connect: ");
  Serial.print("http://");
  Serial.print(WiFi.localIP().toString());
  Serial.println("/");
}

/**
   @brief

*/
void loop()
{
  server.handleClient();
  if (millis() - start_time > refreshTime)
  {
    start_time = millis();
    logSensorsReading();
  }
}

/**
   @brief

   @param httpCode
*/
void handleHTTPResponse(int httpCode)
{
  if (httpCode > 0)
  {
    Serial.println("HTTP Code " + String(httpCode));
    if (httpCode == HTTP_CODE_OK)
    {
      Serial.println("OK");
    }
  }
  else
  {
    Serial.print("ERROR with Code:");
    Serial.println(httpCode);
  }
}

/**
   @brief

*/
void handleNotFound()
{
  String message = "File Not Found\n\n";
  message += "URI: ";
  message += server.uri();
  message += "\nMethod: ";
  message += (server.method() == HTTP_GET) ? "GET" : "POST";
  message += "\nArguments: ";
  message += server.args();
  message += "\n";
  for (uint8_t i = 0; i < server.args(); i++)
  {
    message += " " + server.argName(i) + ": " + server.arg(i) + "\n";
  }
  server.send(404, "text/plain", message);
}

/**
   @brief Set the Cross Origin object

*/
void setCrossOrigin()
{
  server.sendHeader(F("Access-Control-Allow-Origin"), F("*"));
  server.sendHeader(F("Access-Control-Max-Age"), F("600"));
  server.sendHeader(F("Access-Control-Allow-Methods"), F("PUT,POST,GET,OPTIONS"));
  server.sendHeader(F("Access-Control-Allow-Headers"), F("*"));
};

/**
   @brief

*/
void restServerRouting()
{
  server.on(F("/RELAY=ON"), HTTP_GET, turnOnRelay);
  server.on(F("/RELAY=OFF"), HTTP_GET, turnOffRelay);
}

/**
   @brief

*/
void logSensorsReading()
{
  String device = WiFi.localIP().toString();
  float value = getWatts();

  WiFiClient client;
  HTTPClient http;

  String data = "device=" + device + "&value=" + value + "&state=" + state;
  Serial.println(data);
  http.begin(client, loggerURL);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");

  int httpCode = http.POST(data);
  handleHTTPResponse(httpCode);
  String response = http.getString();
  Serial.println(response);
  http.end();
}

/**
   @brief Get the Intensidad object
   @return float
*/
float getIntensidad()
{
  float result;
  int readValue;             // lectura del valor
  int maxValue = 0;          // maximo valor
  int minValue = 1024;          // minimo valor

  uint32_t start_time = millis();
  while ((millis() - start_time) < 1000) // lecturas durante 1 segundo
  {
    readValue = analogRead(sensorACS712);
    if (readValue > maxValue)
    {
      maxValue = readValue;
    }
    if (readValue < minValue)
    {
      minValue = readValue;
    }
  }
  Serial.println(minValue);
  Serial.println(maxValue);
  result = ((maxValue - minValue) * 5.0) / 1024.0;

  return result;
}

/**
   @brief Get the Watts object
   @return float
*/
float getWatts()
{
  Voltage = getIntensidad();
  VRMS = (Voltage / 2.0) * 0.707; //root 2 is 0.707
  AmpsRMS = (VRMS * 1000) / mVA;
  float Watts = AmpsRMS * tensionRed;
  Serial.print(AmpsRMS);
  Serial.println(" Amps RMS ");
  Serial.print(Watts);
  Serial.println(" Watt ");

  if (AmpsRMS < offset)
  {
    return 0.0;
  }
  else
  {
    return Watts;
  }
}

/**
   @brief

*/
void turnOffRelay()
{
  setCrossOrigin();
  Serial.println("APAGAR");
  digitalWrite(relay, HIGH);
  state = false;
  server.send(200, "text/plain", "RELAY OFF");
}

/**
   @brief

*/
void turnOnRelay()
{
  setCrossOrigin();
  Serial.println("ENCENDER");
  digitalWrite(relay, LOW);
  state = true;
  server.send(200, "text/plain", "RELAY ON");
}
