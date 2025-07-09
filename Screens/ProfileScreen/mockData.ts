import { LawyerProfileData } from "../../Types/appTypes";

export const mockLawyerProfileData: LawyerProfileData = {
  avatarUrl: "https://via.placeholder.com/150", // Placeholder image
  name: "John Doe",
  designation: "Senior Legal Counsel",
  practiceAreas: ["Corporate Law", "Litigation", "IP Rights"],
  stats: {
    totalCases: 125,
    upcomingHearings: 8,
    yearsOfPractice: 10,
    yearsOfPracticeLastUpdated: new Date().toISOString().split('T')[0], // Set to today for calculation base
  },
  aboutMe:
    "Dedicated and results-oriented Senior Legal Counsel with 10 years of experience in providing expert legal advice and representation. Proven ability to manage complex legal matters and achieve favorable outcomes for clients. Strong background in corporate law, litigation, and intellectual property rights.",
  contactInfo: {
    email: "john.doe@example.com",
    phone: "+1-234-567-8900",
    address: "123 Legal Ave, Suite 400, Lawsville, LS 54321",
  },
  languages: ["English", "Spanish", "French"],
  recentActivity: [
    {
      id: "1",
      date: "Oct 26, 2023",
      description: 'Closed "Acme Corp Merger" case.',
    },
    {
      id: "2",
      date: "Oct 20, 2023",
      description: 'Won a significant IP infringement lawsuit for "Innovatech Ltd."',
    },
    {
      id: "3",
      date: "Oct 15, 2023",
      description: "Filed a new patent application for a client.",
    },
    {
      id: "4",
      date: "Oct 10, 2023",
      description: "Attended Continuing Legal Education (CLE) seminar on AI in Law.",
    },
  ],
};
