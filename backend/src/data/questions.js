const questions = [
  // General Knowledge - Easy
  { question: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correctIndex: 2, category: "General Knowledge", difficulty: "easy" },
  { question: "How many sides does a hexagon have?", options: ["5", "6", "7", "8"], correctIndex: 1, category: "General Knowledge", difficulty: "easy" },
  { question: "What color is the sky on a clear day?", options: ["Green", "Red", "Blue", "Yellow"], correctIndex: 2, category: "General Knowledge", difficulty: "easy" },
  { question: "How many days are in a week?", options: ["5", "6", "7", "8"], correctIndex: 2, category: "General Knowledge", difficulty: "easy" },
  { question: "What is the largest planet in our solar system?", options: ["Saturn", "Jupiter", "Neptune", "Earth"], correctIndex: 1, category: "General Knowledge", difficulty: "easy" },
  { question: "What animal is known as the 'King of the Jungle'?", options: ["Tiger", "Bear", "Elephant", "Lion"], correctIndex: 3, category: "General Knowledge", difficulty: "easy" },
  { question: "How many continents are there on Earth?", options: ["5", "6", "7", "8"], correctIndex: 2, category: "General Knowledge", difficulty: "easy" },
  { question: "What is the smallest country in the world?", options: ["Monaco", "San Marino", "Vatican City", "Liechtenstein"], correctIndex: 2, category: "General Knowledge", difficulty: "easy" },
  { question: "Which ocean is the largest?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctIndex: 3, category: "General Knowledge", difficulty: "easy" },
  { question: "What is the currency of Japan?", options: ["Yuan", "Won", "Yen", "Ringgit"], correctIndex: 2, category: "General Knowledge", difficulty: "easy" },

  // General Knowledge - Medium
  { question: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], correctIndex: 2, category: "General Knowledge", difficulty: "medium" },
  { question: "In which year did World War II end?", options: ["1943", "1944", "1945", "1946"], correctIndex: 2, category: "General Knowledge", difficulty: "medium" },
  { question: "What is the speed of light in a vacuum?", options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "250,000 km/s"], correctIndex: 0, category: "General Knowledge", difficulty: "medium" },
  { question: "Which country has the most natural lakes?", options: ["Russia", "USA", "Canada", "Brazil"], correctIndex: 2, category: "General Knowledge", difficulty: "medium" },
  { question: "What is the hardest natural substance on Earth?", options: ["Ruby", "Diamond", "Emerald", "Quartz"], correctIndex: 1, category: "General Knowledge", difficulty: "medium" },
  { question: "How many bones are in the adult human body?", options: ["186", "196", "206", "216"], correctIndex: 2, category: "General Knowledge", difficulty: "medium" },
  { question: "What does 'HTTP' stand for?", options: ["HyperText Transfer Protocol", "High Tech Transfer Protocol", "HyperText Transport Program", "Hybrid Text Transfer Process"], correctIndex: 0, category: "General Knowledge", difficulty: "medium" },
  { question: "Which element has the atomic number 1?", options: ["Helium", "Hydrogen", "Lithium", "Carbon"], correctIndex: 1, category: "General Knowledge", difficulty: "medium" },

  // General Knowledge - Hard
  { question: "What is the Fibonacci sequence pattern?", options: ["Each number is double the previous", "Each number is the sum of the two before it", "Each number is the square of the previous", "Each number is three less than the next"], correctIndex: 1, category: "General Knowledge", difficulty: "hard" },
  { question: "What is the Planck constant approximately equal to?", options: ["6.626 × 10⁻³⁴ J·s", "3.14 × 10⁻³⁴ J·s", "9.109 × 10⁻³¹ J·s", "1.602 × 10⁻¹⁹ J·s"], correctIndex: 0, category: "General Knowledge", difficulty: "hard" },

  // Science - Easy
  { question: "What is H₂O commonly known as?", options: ["Hydrogen gas", "Oxygen", "Water", "Salt"], correctIndex: 2, category: "Science", difficulty: "easy" },
  { question: "What gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correctIndex: 2, category: "Science", difficulty: "easy" },
  { question: "How many bones are in a human hand?", options: ["17", "22", "27", "32"], correctIndex: 2, category: "Science", difficulty: "easy" },
  { question: "What force keeps us on the ground?", options: ["Magnetism", "Gravity", "Friction", "Electricity"], correctIndex: 1, category: "Science", difficulty: "easy" },

  // Science - Medium
  { question: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Lysosome"], correctIndex: 2, category: "Science", difficulty: "medium" },
  { question: "What is the chemical formula for table salt?", options: ["KCl", "NaCl", "MgCl₂", "CaCl₂"], correctIndex: 1, category: "Science", difficulty: "medium" },
  { question: "Which planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Mars", "Saturn"], correctIndex: 2, category: "Science", difficulty: "medium" },
  { question: "What is the process by which plants make food?", options: ["Respiration", "Photosynthesis", "Fermentation", "Digestion"], correctIndex: 1, category: "Science", difficulty: "medium" },
  { question: "What is the most abundant gas in Earth's atmosphere?", options: ["Oxygen", "Carbon Dioxide", "Argon", "Nitrogen"], correctIndex: 3, category: "Science", difficulty: "medium" },
  { question: "DNA stands for?", options: ["Deoxyribonucleic Acid", "Dinitrogen Acid", "Deoxyribose Nucleotide Array", "Double Nucleic Acid"], correctIndex: 0, category: "Science", difficulty: "medium" },

  // Science - Hard
  { question: "What is the half-life of Carbon-14?", options: ["1,730 years", "5,730 years", "12,300 years", "50,000 years"], correctIndex: 1, category: "Science", difficulty: "hard" },
  { question: "What particle has no electric charge in an atom?", options: ["Proton", "Electron", "Neutron", "Positron"], correctIndex: 2, category: "Science", difficulty: "hard" },
  { question: "Schrödinger's cat thought experiment involves which field?", options: ["Relativity", "Quantum Mechanics", "Thermodynamics", "Electromagnetism"], correctIndex: 1, category: "Science", difficulty: "hard" },

  // History - Easy
  { question: "Who was the first President of the United States?", options: ["Abraham Lincoln", "Thomas Jefferson", "George Washington", "John Adams"], correctIndex: 2, category: "History", difficulty: "easy" },
  { question: "In which year did World War I begin?", options: ["1912", "1914", "1916", "1918"], correctIndex: 1, category: "History", difficulty: "easy" },
  { question: "The Great Wall of China was primarily built to protect against whom?", options: ["Japanese invaders", "Mongol raiders", "Persian armies", "Russian forces"], correctIndex: 1, category: "History", difficulty: "easy" },
  { question: "Which ancient wonder was located in Egypt?", options: ["Colosseum", "Parthenon", "Great Pyramid of Giza", "Stonehenge"], correctIndex: 2, category: "History", difficulty: "easy" },

  // History - Medium
  { question: "In which year did the Berlin Wall fall?", options: ["1987", "1988", "1989", "1991"], correctIndex: 2, category: "History", difficulty: "medium" },
  { question: "Who wrote the Magna Carta?", options: ["King John", "No single person; barons forced King John to sign it", "The Pope", "William the Conqueror"], correctIndex: 1, category: "History", difficulty: "medium" },
  { question: "Which empire was ruled by Genghis Khan?", options: ["Ottoman Empire", "Roman Empire", "Mongol Empire", "Persian Empire"], correctIndex: 2, category: "History", difficulty: "medium" },
  { question: "The Renaissance originated in which country?", options: ["France", "Germany", "Italy", "Spain"], correctIndex: 2, category: "History", difficulty: "medium" },
  { question: "Who was the first person to walk on the moon?", options: ["Buzz Aldrin", "Yuri Gagarin", "Neil Armstrong", "John Glenn"], correctIndex: 2, category: "History", difficulty: "medium" },

  // History - Hard
  { question: "In what year was the Magna Carta signed?", options: ["1066", "1215", "1348", "1492"], correctIndex: 1, category: "History", difficulty: "hard" },
  { question: "Which battle ended Napoleon's rule?", options: ["Battle of Austerlitz", "Battle of Trafalgar", "Battle of Waterloo", "Battle of Leipzig"], correctIndex: 2, category: "History", difficulty: "hard" },

  // Geography - Easy
  { question: "What is the longest river in the world?", options: ["Amazon", "Nile", "Mississippi", "Yangtze"], correctIndex: 1, category: "Geography", difficulty: "easy" },
  { question: "Mount Everest is in which mountain range?", options: ["Alps", "Andes", "Rocky Mountains", "Himalayas"], correctIndex: 3, category: "Geography", difficulty: "easy" },
  { question: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Brisbane"], correctIndex: 2, category: "Geography", difficulty: "easy" },
  { question: "Which country has the largest land area?", options: ["China", "USA", "Canada", "Russia"], correctIndex: 3, category: "Geography", difficulty: "easy" },

  // Geography - Medium
  { question: "The Sahara Desert is located on which continent?", options: ["Asia", "South America", "Australia", "Africa"], correctIndex: 3, category: "Geography", difficulty: "medium" },
  { question: "What is the capital of Canada?", options: ["Toronto", "Vancouver", "Ottawa", "Montreal"], correctIndex: 2, category: "Geography", difficulty: "medium" },
  { question: "Which country has the most time zones?", options: ["Russia", "USA", "China", "France"], correctIndex: 3, category: "Geography", difficulty: "medium" },
  { question: "The Amazon Rainforest is primarily in which country?", options: ["Colombia", "Peru", "Venezuela", "Brazil"], correctIndex: 3, category: "Geography", difficulty: "medium" },

  // Sports - Easy
  { question: "How many players are on a standard soccer team on the field?", options: ["9", "10", "11", "12"], correctIndex: 2, category: "Sports", difficulty: "easy" },
  { question: "In which sport do you use a shuttlecock?", options: ["Tennis", "Badminton", "Squash", "Pickleball"], correctIndex: 1, category: "Sports", difficulty: "easy" },
  { question: "How many rings are on the Olympic flag?", options: ["4", "5", "6", "7"], correctIndex: 1, category: "Sports", difficulty: "easy" },
  { question: "Which country invented basketball?", options: ["USA", "Canada", "UK", "Australia"], correctIndex: 0, category: "Sports", difficulty: "easy" },

  // Sports - Medium
  { question: "In tennis, what is the term for a score of 40-40?", options: ["Tie", "Deuce", "Match point", "Set point"], correctIndex: 1, category: "Sports", difficulty: "medium" },
  { question: "How many Grand Slam tournaments are there in tennis?", options: ["2", "3", "4", "5"], correctIndex: 2, category: "Sports", difficulty: "medium" },
  { question: "In which year were the first modern Olympic Games held?", options: ["1888", "1896", "1900", "1904"], correctIndex: 1, category: "Sports", difficulty: "medium" },

  // Entertainment - Easy
  { question: "Who played Iron Man in the MCU?", options: ["Chris Evans", "Robert Downey Jr.", "Chris Hemsworth", "Mark Ruffalo"], correctIndex: 1, category: "Entertainment", difficulty: "easy" },
  { question: "Which animated film features a lion named Simba?", options: ["Bambi", "Jungle Book", "The Lion King", "Madagascar"], correctIndex: 2, category: "Entertainment", difficulty: "easy" },
  { question: "What is the name of the wizard school in Harry Potter?", options: ["Beauxbatons", "Durmstrang", "Hogwarts", "Ilvermorny"], correctIndex: 2, category: "Entertainment", difficulty: "easy" },
  { question: "Who created Mickey Mouse?", options: ["Chuck Jones", "Tex Avery", "Walt Disney", "Ub Iwerks"], correctIndex: 2, category: "Entertainment", difficulty: "easy" },

  // Entertainment - Medium
  { question: "Which band performed 'Bohemian Rhapsody'?", options: ["The Beatles", "Led Zeppelin", "Queen", "Pink Floyd"], correctIndex: 2, category: "Entertainment", difficulty: "medium" },
  { question: "Who directed 'Inception'?", options: ["Steven Spielberg", "Christopher Nolan", "James Cameron", "Ridley Scott"], correctIndex: 1, category: "Entertainment", difficulty: "medium" },
  { question: "What is the highest-grossing film of all time (as of 2023)?", options: ["Titanic", "Avengers: Endgame", "Avatar", "Star Wars: The Force Awakens"], correctIndex: 2, category: "Entertainment", difficulty: "medium" },
  { question: "In which country did the K-pop phenomenon originate?", options: ["Japan", "China", "South Korea", "Thailand"], correctIndex: 2, category: "Entertainment", difficulty: "medium" },

  // Technology - Easy
  { question: "What does 'www' stand for?", options: ["World Wide Web", "Western Web Works", "World Wide Word", "World Web Wire"], correctIndex: 0, category: "Technology", difficulty: "easy" },
  { question: "Which company created the iPhone?", options: ["Google", "Samsung", "Apple", "Microsoft"], correctIndex: 2, category: "Technology", difficulty: "easy" },
  { question: "What does 'CPU' stand for?", options: ["Central Processing Unit", "Computer Power Unit", "Core Processing Unit", "Central Program Utility"], correctIndex: 0, category: "Technology", difficulty: "easy" },
  { question: "What programming language is known as the 'language of the web'?", options: ["Python", "Java", "JavaScript", "C++"], correctIndex: 2, category: "Technology", difficulty: "easy" },

  // Technology - Medium
  { question: "What does 'RAM' stand for?", options: ["Random Access Memory", "Read Access Memory", "Runtime Application Memory", "Rapid Access Module"], correctIndex: 0, category: "Technology", difficulty: "medium" },
  { question: "Which company developed the Android operating system?", options: ["Apple", "Microsoft", "Samsung", "Google"], correctIndex: 3, category: "Technology", difficulty: "medium" },
  { question: "What does 'API' stand for?", options: ["Application Programming Interface", "Advanced Programming Interface", "Automated Process Integration", "Application Protocol Interface"], correctIndex: 0, category: "Technology", difficulty: "medium" },
  { question: "In what year was the World Wide Web invented?", options: ["1985", "1989", "1991", "1995"], correctIndex: 1, category: "Technology", difficulty: "medium" },
  { question: "What is the binary representation of the decimal number 10?", options: ["0101", "1001", "1010", "1100"], correctIndex: 2, category: "Technology", difficulty: "medium" },

  // Technology - Hard
  { question: "What does 'SQL' stand for?", options: ["Structured Query Language", "Standard Query Logic", "Simple Query Language", "System Query Link"], correctIndex: 0, category: "Technology", difficulty: "hard" },
  { question: "What is the time complexity of binary search?", options: ["O(n)", "O(n²)", "O(log n)", "O(n log n)"], correctIndex: 2, category: "Technology", difficulty: "hard" },
  { question: "Which sorting algorithm has the best average-case time complexity?", options: ["Bubble Sort", "Merge Sort", "Insertion Sort", "Selection Sort"], correctIndex: 1, category: "Technology", difficulty: "hard" },

  // Math - Easy
  { question: "What is 12 × 12?", options: ["132", "144", "156", "124"], correctIndex: 1, category: "Math", difficulty: "easy" },
  { question: "What is the square root of 64?", options: ["6", "7", "8", "9"], correctIndex: 2, category: "Math", difficulty: "easy" },
  { question: "What is 15% of 200?", options: ["25", "30", "35", "40"], correctIndex: 1, category: "Math", difficulty: "easy" },
  { question: "What is π (pi) approximately equal to?", options: ["2.14", "3.14", "4.14", "3.41"], correctIndex: 1, category: "Math", difficulty: "easy" },

  // Math - Medium
  { question: "What is 2⁸?", options: ["128", "256", "512", "64"], correctIndex: 1, category: "Math", difficulty: "medium" },
  { question: "If a triangle has angles of 60° and 80°, what is the third angle?", options: ["30°", "40°", "50°", "60°"], correctIndex: 1, category: "Math", difficulty: "medium" },
  { question: "What is the sum of angles in a pentagon?", options: ["360°", "450°", "540°", "720°"], correctIndex: 2, category: "Math", difficulty: "medium" },
  { question: "What is 7! (7 factorial)?", options: ["2,520", "5,040", "720", "40,320"], correctIndex: 1, category: "Math", difficulty: "medium" },

  // Math - Hard
  { question: "What is the derivative of x³?", options: ["x²", "2x²", "3x²", "3x"], correctIndex: 2, category: "Math", difficulty: "hard" },
  { question: "What is the integral of 2x?", options: ["x + C", "2 + C", "x² + C", "2x² + C"], correctIndex: 2, category: "Math", difficulty: "hard" },
  { question: "In a normal distribution, what percentage of data falls within 2 standard deviations of the mean?", options: ["68%", "90%", "95%", "99.7%"], correctIndex: 2, category: "Math", difficulty: "hard" },
];

module.exports = questions;
