const byte triggerPin = 2;
const byte echoPin = 1;

void setup() {
  pinMode(triggerPin, OUTPUT);
  digitalWrite(triggerPin, LOW);
  pinMode(echoPin, INPUT);
  Serial.begin(115200);
}

void loop() {
  digitalWrite(triggerPin, LOW);
  delayMicroseconds(2);
  digitalWrite(triggerPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(triggerPin, LOW);

  const unsigned long echoMicros = pulseIn(echoPin, HIGH, 25000UL);
  if (echoMicros > 0) {
    const float centimeters = echoMicros * 0.01715f;
    if (centimeters >= 2.0f && centimeters <= 400.0f) {
      Serial.println(centimeters, 1);
    }
  }
  delay(60);
}