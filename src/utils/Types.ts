import { Timestamp } from "firebase/firestore";

export type Person = {
  timestamp: Timestamp; // Assuming timestamp is a date string
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  birthDate: Timestamp; // Assuming birthDate is a date string
  occupation: string;
  roleDefinition: string;
  workplace: string;
  spouseOccupation: string;
  hobbies: string[];
  childrenCount: number; // Assuming it's a number
  childrenAges: string[];
  motivation: string;
  expectations: string;
  specialNeeds: string;
  participationInLeisure: "כן" | "לא" | "אולי";
  leadershipParticipation: "כן" | "לא" | "אולי";
  supportArea: string;
  availableAssets: string;
};