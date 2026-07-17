export interface Question {
    q: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

export interface Lesson {
    id: string;
    type: 'theory' | 'quiz' | 'midterm' | 'final';
    title: string;
    content?: string;
    image?: string;
    questions?: Question[];
}

export interface Province {
    id: string;
    name: string;
    color: string;
    lessons: Lesson[];
}

export interface Region {
    id: string;
    name: string;
    color: string;
    provinces: Province[];
}


export interface TelemetryData {
    timeSpentPerQuestion: number[]; // seconds per question
    weaknessTags: string[]; // e.g., 'Atlat', 'Biểu đồ', 'Kinh tế vùng'
    studyHabits: string[]; // e.g., 'Morning', 'Evening'
}

export interface UserProfileExtension {
    telemetry: TelemetryData;
    streak: number;
    lastLogin: string; // ISO Date String
}
