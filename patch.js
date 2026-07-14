const fs = require('fs');
const content = fs.readFileSync('src/pages/MockExam.tsx', 'utf8');

const newTopics = `const SYLLABUS_TOPICS: Record<string, string[]> = {
  // O Level
  '1-Mathematics': ['Number', 'Algebra', 'Geometry', 'Mensuration', 'Coordinate Geometry', 'Trigonometry', 'Vectors', 'Probability & Statistics'],
  '1-Physics': ['General Physics', 'Thermal Physics', 'Waves (Light & Sound)', 'Electricity and Magnetism', 'Atomic Physics'],
  '1-Chemistry': ['States of Matter', 'Atoms, Elements & Compounds', 'Stoichiometry', 'Electrochemistry', 'Chemical Energetics', 'Chemical Reactions', 'Acids, Bases & Salts', 'The Periodic Table', 'Metals', 'Chemistry of the Environment', 'Organic Chemistry', 'Experimental Techniques'],
  '1-Biology': ['Cell structure', 'Biological molecules', 'Enzymes', 'Plant nutrition', 'Animal nutrition', 'Transport in plants', 'Transport in animals', 'Respiration', 'Coordination and response', 'Reproduction', 'Inheritance'],
  '1-Computer Science': ['Data representation', 'Communication and Internet technologies', 'Hardware and software', 'Security', 'Ethics', 'Algorithm design and problem-solving', 'Programming', 'Databases'],
  '1-Economics': ['The basic economic problem', 'The allocation of resources', 'Microeconomic decision makers', 'Government and the macroeconomy', 'Economic development', 'International trade and globalisation'],
  '1-Business Studies': ['Understanding business activity', 'People in business', 'Marketing', 'Operations management', 'Financial information and decisions', 'External influences on business activity'],
  '1-English Language': ['Reading for ideas', 'Reading for meaning', 'Directed Writing', 'Composition'],
  
  // A Level
  '2-Further Mathematics': ['Polynomial equations and rational functions', 'Complex numbers', 'Matrices', 'Polar coordinates', 'Vectors', 'Hyperbolic functions', 'Calculus', 'Further Mechanics', 'Further Probability & Statistics'],
  '2-Biology': ['Cell structure', 'Biological molecules', 'Enzymes', 'Cell membranes and transport', 'The mitotic cell cycle', 'Nucleic acids and protein synthesis', 'Transport in plants', 'Transport in mammals', 'Gas exchange and smoking', 'Infectious disease', 'Immunity', 'Energy and respiration', 'Photosynthesis', 'Homeostasis', 'Control and co-ordination', 'Inherited change', 'Selection and evolution', 'Biodiversity, classification, and conservation', 'Genetic technology'],
  '2-Mathematics': ['Quadratics', 'Functions', 'Coordinate geometry', 'Circular measure', 'Trigonometry', 'Series', 'Differentiation', 'Integration', 'Algebra', 'Logarithmic and exponential functions', 'Vector geometry', 'Complex numbers', 'Differential equations', 'Mechanics', 'Probability & Statistics'],
  '2-Physics': ['Physical quantities and units', 'Kinematics', 'Dynamics', 'Forces, density and pressure', 'Work, energy and power', 'Deformation of solids', 'Waves', 'Superposition', 'Electricity', 'D.C. circuits', 'Particle physics', 'Motion in a circle', 'Gravitational fields', 'Ideal gases', 'Temperature', 'Thermal properties of materials', 'Oscillations', 'Communication', 'Capacitance', 'Electronics', 'Magnetic fields', 'Electromagnetic induction', 'Alternating currents', 'Quantum physics', 'Nuclear physics'],
  '2-Chemistry': ['Atoms, molecules and stoichiometry', 'Atomic structure', 'Chemical bonding', 'States of matter', 'Chemical energetics', 'Electrochemistry', 'Equilibria', 'Reaction kinetics', 'Periodicity', 'Group 2', 'Halogens', 'Nitrogen and sulfur', 'Introduction to organic chemistry', 'Hydrocarbons', 'Halogen derivatives', 'Hydroxy compounds', 'Carbonyl compounds', 'Carboxylic acids and derivatives', 'Nitrogen compounds', 'Polymerisation', 'Analytical chemistry', 'Organic synthesis'],
  '2-Computer Science': ['Information representation', 'Communication and Internet technologies', 'Hardware', 'Processor fundamentals', 'System software', 'Security, privacy and data integrity', 'Ethics and ownership', 'Databases', 'Algorithm design and problem-solving', 'Data representation', 'Programming', 'Software development'],
  '2-Economics': ['Basic economic ideas and resource allocation', 'The price system and the micro economy', 'Government microeconomic intervention', 'The macro economy', 'Government macroeconomic intervention', 'International economic issues'],
  '2-Business': ['Business and its environment', 'People in organisations', 'Marketing', 'Operations and project management', 'Finance and accounting', 'Strategic management'],

  // SAT
  '3-Math': ['Algebra', 'Advanced Math', 'Problem-Solving and Data Analysis', 'Geometry and Trigonometry'],
  '3-Reading & Writing': ['Information and Ideas', 'Craft and Structure', 'Expression of Ideas', 'Standard English Conventions']
};`;

const replacedContent = content.replace(/const SYLLABUS_TOPICS: Record<string, string\[\]> = \{[\s\S]*?};\n/, newTopics + '\n');
fs.writeFileSync('src/pages/MockExam.tsx', replacedContent);
console.log("Updated topics dictionary.");
