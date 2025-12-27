import { UserProfile } from "@/lib/types";

export const dummyProfile: UserProfile = {
    name: "Phyllis User",
    email: "phyllis@example.com",
    phone: "+1 555-0123",
    location: "San Francisco, CA",
    links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/phyllis" },
        { label: "GitHub", url: "https://github.com/phyllis" }
    ],
    summary: "Senior Full Stack Engineer with 8 years of experience building scalable web applications. Expert in React, Node.js, and Cloud Infrastructure.",
    skills: ["React", "Typescript", "Node.js", "AWS", "Next.js", "Python", "Docker"],
    experience: [
        {
            company: "Tech Corp",
            role: "Senior Software Engineer",
            startDate: "2020-01",
            endDate: "Present",
            description: "Led the migration of legacy monolith to microservices using Node.js and Kubernetes. Improved system uptime by 99.9%."
        },
        {
            company: "Startup Inc",
            role: "Software Engineer",
            startDate: "2018-06",
            endDate: "2019-12",
            description: "Developed core features for the e-commerce platform using React and Redux."
        }
    ],
    education: [
        {
            school: "University of Tech",
            degree: "B.S. Computer Science",
            year: "2018"
        }
    ],
    projects: []
};
