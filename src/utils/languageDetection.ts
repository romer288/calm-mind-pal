
// Common Spanish words and phrases for language detection
const spanishKeywords = [
  'hola', 'como', 'estas', 'que', 'tal', 'bien', 'mal', 'gracias', 'por', 'favor',
  'si', 'no', 'yo', 'tu', 'el', 'ella', 'nosotros', 'ustedes', 'ellos', 'donde',
  'cuando', 'porque', 'quien', 'cual', 'muy', 'mas', 'menos', 'antes', 'despues',
  'ahora', 'aqui', 'alli', 'alla', 'este', 'esta', 'esto', 'ese', 'esa', 'eso',
  'aquel', 'aquella', 'aquello', 'mi', 'tu', 'su', 'nuestro', 'vuestro', 'suyo',
  'mio', 'tuyo', 'suya', 'nuestra', 'vuestra', 'suyas', 'ansiedad', 'miedo',
  'preocupacion', 'estres', 'nervioso', 'nerviosa', 'triste', 'feliz', 'enojado',
  'enojada', 'cansado', 'cansada', 'ayuda', 'necesito', 'quiero', 'puedo',
  'tengo', 'soy', 'estoy', 'siento', 'pienso', 'creo', 'trabajo', 'familia',
  'amigos', 'problemas', 'dificultades', 'solucion', 'mejor', 'peor'
];

// Common English words for comparison
const englishKeywords = [
  'hello', 'how', 'are', 'you', 'what', 'good', 'bad', 'thanks', 'please',
  'yes', 'no', 'i', 'me', 'my', 'we', 'they', 'where', 'when', 'why', 'who',
  'which', 'very', 'more', 'less', 'before', 'after', 'now', 'here', 'there',
  'this', 'that', 'these', 'those', 'anxiety', 'fear', 'worry', 'stress',
  'nervous', 'sad', 'happy', 'angry', 'tired', 'help', 'need', 'want', 'can',
  'have', 'am', 'is', 'are', 'feel', 'think', 'work', 'family', 'friends',
  'problems', 'difficulties', 'solution', 'better', 'worse'
];

export const detectLanguage = (text: string): 'en' | 'es' => {
  const normalizedText = text.toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^\w\s]/g, ' ');

  const words = normalizedText.split(/\s+/).filter(word => word.length > 2);
  
  let spanishScore = 0;
  let englishScore = 0;

  words.forEach(word => {
    if (spanishKeywords.includes(word)) {
      spanishScore++;
    }
    if (englishKeywords.includes(word)) {
      englishScore++;
    }
  });

  // Check for Spanish-specific patterns
  if (normalizedText.includes('que tal') || 
      normalizedText.includes('como estas') || 
      normalizedText.includes('como esta') ||
      normalizedText.includes('me siento') ||
      normalizedText.includes('tengo miedo') ||
      normalizedText.includes('estoy') ||
      normalizedText.includes('necesito ayuda')) {
    spanishScore += 3;
  }

  // Check for English-specific patterns
  if (normalizedText.includes('how are') || 
      normalizedText.includes('i am') || 
      normalizedText.includes('i feel') ||
      normalizedText.includes('i need') ||
      normalizedText.includes('i have') ||
      normalizedText.includes('i want')) {
    englishScore += 3;
  }

  console.log(`Language detection - Spanish: ${spanishScore}, English: ${englishScore}`);
  
  return spanishScore > englishScore ? 'es' : 'en';
};
