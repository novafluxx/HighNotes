/**
 * Test note fixtures for consistent test data
 */

export interface TestNoteTemplate {
  title: string;
  content: string;
  tags?: string[];
  category?: string;
}

export const NOTE_TEMPLATES = {
  basic: [
    {
      title: 'Meeting Notes',
      content: 'Discussed project timeline and deliverables. Next meeting scheduled for Friday.',
      category: 'work'
    },
    {
      title: 'Shopping List',
      content: 'Milk, Bread, Eggs, Apples, Chicken, Rice',
      category: 'personal'
    },
    {
      title: 'Book Ideas',
      content: 'Ideas for the next chapter: character development, plot twists, setting descriptions.',
      category: 'creative'
    }
  ],

  searchable: [
    {
      title: 'JavaScript Fundamentals',
      content: 'Variables, functions, and scope in JavaScript. Essential concepts for web development.',
      tags: ['javascript', 'programming', 'web-development'],
      category: 'learning'
    },
    {
      title: 'React Components',
      content: 'Building reusable components in React. Props, state, and lifecycle methods.',
      tags: ['react', 'javascript', 'components'],
      category: 'learning'
    },
    {
      title: 'Database Design',
      content: 'Relational database concepts, normalization, and SQL queries for data management.',
      tags: ['database', 'sql', 'design'],
      category: 'learning'
    },
    {
      title: 'API Development',
      content: 'RESTful API design principles, HTTP methods, and authentication strategies.',
      tags: ['api', 'rest', 'backend'],
      category: 'learning'
    }
  ],

  longContent: [
    {
      title: 'Project Documentation',
      content: `# Project Overview

This is a comprehensive project documentation that contains multiple sections and detailed information.

## Architecture
The application follows a modern architecture pattern with clear separation of concerns.

### Frontend
- Built with Nuxt 3 and Vue 3
- Uses Composition API for better code organization
- Implements responsive design with Tailwind CSS

### Backend
- Supabase for database and authentication
- Real-time subscriptions for live updates
- Row Level Security for data protection

## Features
1. User authentication and authorization
2. Note creation, editing, and deletion
3. Real-time collaboration
4. Search and filtering capabilities
5. Mobile-responsive design

## Testing Strategy
Comprehensive testing approach including:
- Unit tests for composables
- Component tests for UI elements
- Integration tests for database operations
- End-to-end tests for user workflows

This documentation serves as a reference for developers working on the project.`,
      category: 'documentation'
    }
  ],

  performance: {
    generateBatch: (batchNumber: number, batchSize: number = 50): TestNoteTemplate[] => {
      return Array.from({ length: batchSize }, (_, i) => {
        const noteIndex = batchNumber * batchSize + i + 1;
        return {
          title: `Performance Test Note ${noteIndex}`,
          content: `This is performance test note ${noteIndex}. It contains enough content to test rendering and search performance with larger datasets. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`,
          category: 'performance-test',
          tags: ['performance', 'test', `batch-${batchNumber}`]
        };
      });
    }
  }
} as const;

export const getRandomNoteTemplate = (): TestNoteTemplate => {
  const allTemplates = [...NOTE_TEMPLATES.basic, ...NOTE_TEMPLATES.searchable];
  return allTemplates[Math.floor(Math.random() * allTemplates.length)];
};

export const getNotesByCategory = (category: string): TestNoteTemplate[] => {
  const allTemplates = [...NOTE_TEMPLATES.basic, ...NOTE_TEMPLATES.searchable, ...NOTE_TEMPLATES.longContent];
  return allTemplates.filter(note => note.category === category);
};

export const getSearchableNotes = (): TestNoteTemplate[] => {
  return NOTE_TEMPLATES.searchable;
};