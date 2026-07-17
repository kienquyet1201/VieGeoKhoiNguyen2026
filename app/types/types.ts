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
