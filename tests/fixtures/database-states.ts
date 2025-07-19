/**
 * Database state fixtures for consistent test scenarios
 */

import { TestNoteTemplate } from './notes';
import { TestUser } from './users';

export interface DatabaseState {
  name: string;
  description: string;
  users: TestUser[];
  notes: TestNoteTemplate[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

export const DATABASE_STATES = {
  empty: {
    name: 'Empty State',
    description: 'Clean database with no notes',
    users: [],
    notes: []
  },

  singleUser: {
    name: 'Single User with Basic Notes',
    description: 'One user with a few basic notes for standard testing',
    users: [
      {
        email: process.env.TEST_USER || 'test@example.com',
        password: process.env.TEST_PASSWORD || 'Test1234!',
        role: 'user' as const
      }
    ],
    notes: [
      {
        title: 'Welcome Note',
        content: 'Welcome to High Notes! This is your first note.',
        category: 'getting-started'
      },
      {
        title: 'Quick Tips',
        content: 'You can create, edit, and delete notes. Use the search feature to find notes quickly.',
        category: 'tips'
      }
    ]
  },

  searchTesting: {
    name: 'Search Testing Dataset',
    description: 'Optimized dataset for testing search and filtering functionality',
    users: [
      {
        email: process.env.TEST_USER || 'test@example.com',
        password: process.env.TEST_PASSWORD || 'Test1234!',
        role: 'user' as const
      }
    ],
    notes: [
      {
        title: 'JavaScript Fundamentals',
        content: 'Variables, functions, and scope in JavaScript. Essential concepts for web development.',
        tags: ['javascript', 'programming'],
        category: 'learning'
      },
      {
        title: 'React Components',
        content: 'Building reusable components in React. Props, state, and lifecycle methods.',
        tags: ['react', 'javascript'],
        category: 'learning'
      },
      {
        title: 'Database Design',
        content: 'Relational database concepts, normalization, and SQL queries.',
        tags: ['database', 'sql'],
        category: 'learning'
      },
      {
        title: 'Meeting Notes - JavaScript Review',
        content: 'Reviewed JavaScript concepts with the team. Discussed best practices.',
        tags: ['meeting', 'javascript'],
        category: 'work'
      }
    ]
  },

  performanceTesting: {
    name: 'Performance Testing Dataset',
    description: 'Large dataset for testing application performance with many notes',
    users: [
      {
        email: process.env.TEST_USER || 'test@example.com',
        password: process.env.TEST_PASSWORD || 'Test1234!',
        role: 'user' as const
      }
    ],
    notes: [] // Will be populated dynamically with large dataset
  },

  edgeCases: {
    name: 'Edge Cases Dataset',
    description: 'Notes with edge case content for robust testing',
    users: [
      {
        email: process.env.TEST_USER || 'test@example.com',
        password: process.env.TEST_PASSWORD || 'Test1234!',
        role: 'user' as const
      }
    ],
    notes: [
      {
        title: '',
        content: 'Note with empty title',
        category: 'edge-case'
      },
      {
        title: 'Empty Content Note',
        content: '',
        category: 'edge-case'
      },
      {
        title: 'Special Characters: !@#$%^&*()_+-=[]{}|;:,.<>?',
        content: 'Testing special characters in title and content: !@#$%^&*()_+-=[]{}|;:,.<>?',
        category: 'edge-case'
      },
      {
        title: 'Very Long Title '.repeat(20),
        content: 'Testing very long title handling',
        category: 'edge-case'
      },
      {
        title: 'Very Long Content',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100),
        category: 'edge-case'
      },
      {
        title: 'Unicode Characters: 🚀 📝 ✅ 🔍 💡',
        content: 'Testing unicode emoji and special characters: 你好 مرحبا Здравствуй',
        category: 'edge-case'
      }
    ]
  }
} as const;

export type DatabaseStateName = keyof typeof DATABASE_STATES;

export const getDatabaseState = (stateName: DatabaseStateName): DatabaseState => {
  const state = DATABASE_STATES[stateName];
  
  // Special handling for performance testing dataset
  if (stateName === 'performanceTesting') {
    const performanceNotes: TestNoteTemplate[] = [];
    
    // Generate 200 notes in batches
    for (let batch = 0; batch < 4; batch++) {
      const batchNotes = Array.from({ length: 50 }, (_, i) => {
        const noteIndex = batch * 50 + i + 1;
        return {
          title: `Performance Note ${noteIndex}`,
          content: `This is performance test note ${noteIndex}. It contains enough content to test rendering and search performance. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
          category: 'performance',
          tags: ['performance', 'test', `batch-${batch + 1}`]
        };
      });
      performanceNotes.push(...batchNotes);
    }
    
    return {
      ...state,
      notes: performanceNotes
    };
  }
  
  return state;
};

export const getAllDatabaseStates = (): DatabaseState[] => {
  return Object.keys(DATABASE_STATES).map(key => 
    getDatabaseState(key as DatabaseStateName)
  );
};