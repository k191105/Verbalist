export type Persona = {
  id: "chris" | "gemma" | "eva" | "sid";
  name: string;
  displayName: string;
  expertise: string;
  description: string;
};

export const PERSONAS: Persona[] = [
  {
    id: "chris",
    name: "Chris",
    displayName: "Chris",
    expertise: "Everyday conversation",
    description: "Friendly, sharp, and natural—like a well-read friend.",
  },
  {
    id: "gemma",
    name: "Gemma",
    displayName: "Gemma",
    expertise: "Literature & arts",
    description: "Literary, lyrical, and steeped in art and storytelling.",
  },
  {
    id: "eva",
    name: "Eva",
    displayName: "Eva",
    expertise: "Philosophy & psychology",
    description: "Thoughtful, reflective, and psychologically insightful.",
  },
  {
    id: "sid",
    name: "Sid",
    displayName: "Sid",
    expertise: "History & politics",
    description: "Historically grounded, analytical, and current-events savvy.",
  },
];
