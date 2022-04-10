const calculator = (distance) => { // De distance property die door Imagga wordt teruggegeven.
  return Math.min(100, Math.max(0, 100 - (distance * 100))); // Geen hogere wiskunde, maar met het oog op enige toekomstige optimalisaties wel verstandig om te unit testen.
}

module.exports = calculator;