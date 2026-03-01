import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { config } from '../env';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Project Management API',
      version: '1.0.0',
      description:
        'A production-grade project management API with organizations, projects, and tasks',
      contact: {
        name: 'API Support',
        url: 'https://github.com/alesz1296-dev/project-backend-api',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: config.API_BASE_URL,
        description:
          config.NODE_ENV === 'production' ? 'Production' : 'Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },

      // ===== SCHEMAS =====
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            avatar: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Organization: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Acme Corp' },
            description: { type: 'string', nullable: true },
            slug: { type: 'string', example: 'acme-corp' },
            ownerId: { type: 'integer', example: 1 },
            owner: { $ref: '#/components/schemas/User' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Membership: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 2 },
            organizationId: { type: 'integer', example: 1 },
            role: {
              type: 'string',
              enum: ['OWNER', 'ADMIN', 'MEMBER'],
              example: 'MEMBER',
              description: 'Organization-level role',
            },
            user: { $ref: '#/components/schemas/User' },
            organization: { $ref: '#/components/schemas/Organization' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Website Redesign' },
            description: { type: 'string', nullable: true },
            organizationId: { type: 'integer', example: 1 },
            createdBy: { type: 'integer', example: 1 },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'ARCHIVED'],
              example: 'ACTIVE',
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ProjectMembership: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 2 },
            projectId: { type: 'integer', example: 1 },
            role: {
              type: 'string',
              enum: ['ADMIN', 'LEAD', 'MEMBER', 'VIEWER'],
              example: 'MEMBER',
              description: 'Project-level role',
            },
            user: { $ref: '#/components/schemas/User' },
            project: { $ref: '#/components/schemas/Project' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'Design homepage' },
            description: { type: 'string', nullable: true },
            projectId: { type: 'integer', example: 1 },
            createdBy: { type: 'integer', nullable: true, example: 1 },
            assignedTo: { type: 'integer', nullable: true, example: 2 },
            status: {
              type: 'string',
              enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'],
              example: 'TODO',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
              example: 'HIGH',
            },
            dueDate: { type: 'string', format: 'date', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },

      // ===== REQUEST BODIES =====
      requestBodies: {
        // Auth/Users
        RegisterUser: {
          required: true,
          description: 'Register a new user account',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'john@example.com',
                    description: 'User email address (must be unique)',
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                    example: 'SecurePassword123!',
                    description:
                      'User password (min 8 chars, must contain uppercase, lowercase, number, special char)',
                  },
                  firstName: {
                    type: 'string',
                    example: 'John',
                    description: 'User first name',
                  },
                  lastName: {
                    type: 'string',
                    example: 'Doe',
                    description: 'User last name',
                  },
                },
              },
            },
          },
        },

        LoginUser: {
          required: true,
          description: 'Login with email and password',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'john@example.com',
                    description: 'User email address',
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                    example: 'SecurePassword123!',
                    description: 'User password',
                  },
                },
              },
            },
          },
        },

        RefreshToken: {
          required: true,
          description: 'Refresh access token',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: {
                    type: 'string',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    description: 'Refresh token from login or previous refresh',
                  },
                },
              },
            },
          },
        },

        LogoutUser: {
          required: false,
          description: 'Logout user',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: {
                    type: 'string',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    description: 'Refresh token to invalidate (optional)',
                  },
                },
              },
            },
          },
        },

        UpdateUser: {
          required: true,
          description: 'Update user profile',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: {
                    type: 'string',
                    example: 'John',
                    description: 'User first name',
                  },
                  lastName: {
                    type: 'string',
                    example: 'Doe',
                    description: 'User last name',
                  },
                  avatar: {
                    type: 'string',
                    nullable: true,
                    example: 'https://example.com/avatar.jpg',
                    description: 'User avatar URL',
                  },
                },
              },
            },
          },
        },

        // Organizations
        CreateOrganization: {
          required: true,
          description: 'Create a new organization',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'slug'],
                properties: {
                  name: {
                    type: 'string',
                    example: 'Acme Corporation',
                    description: 'Organization name (required)',
                  },
                  description: {
                    type: 'string',
                    example: 'Leading provider of widgets',
                    description: 'Organization description (optional)',
                  },
                  slug: {
                    type: 'string',
                    example: 'acme-corp',
                    description: 'URL-friendly identifier (required)',
                    pattern: '^[a-z0-9-]+$',
                  },
                },
              },
            },
          },
        },

        UpdateOrganization: {
          required: true,
          description: 'Update organization details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    example: 'Acme Corporation',
                    description: 'Organization name',
                  },
                  description: {
                    type: 'string',
                    example: 'Leading provider of widgets',
                    description: 'Organization description',
                  },
                  slug: {
                    type: 'string',
                    example: 'acme-corp',
                    description: 'URL-friendly identifier',
                    pattern: '^[a-z0-9-]+$',
                  },
                },
              },
            },
          },
        },

        // Memberships (Organization Level)
        AddMember: {
          required: true,
          description: 'Add member to organization',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId'],
                properties: {
                  userId: {
                    type: 'integer',
                    example: 2,
                    description: 'User ID to add as member',
                  },
                  role: {
                    type: 'string',
                    enum: ['OWNER', 'ADMIN', 'MEMBER'],
                    example: 'MEMBER',
                    description: 'Organization role (defaults to MEMBER)',
                  },
                },
              },
            },
          },
        },

        UpdateMemberRole: {
          required: true,
          description: 'Update member role',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: {
                    type: 'string',
                    enum: ['OWNER', 'ADMIN', 'MEMBER'],
                    example: 'ADMIN',
                    description: 'New role for member',
                  },
                },
              },
            },
          },
        },

        // Projects
        CreateProject: {
          required: true,
          description: 'Create a new project',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: {
                    type: 'string',
                    example: 'Website Redesign',
                    description: 'Project name (required)',
                  },
                  description: {
                    type: 'string',
                    example: 'Modernize company website',
                    description: 'Project description (optional)',
                  },
                },
              },
            },
          },
        },

        UpdateProject: {
          required: true,
          description: 'Update project details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    example: 'Website Redesign',
                    description: 'Project name',
                  },
                  description: {
                    type: 'string',
                    example: 'Modernize company website',
                    description: 'Project description',
                  },
                  status: {
                    type: 'string',
                    enum: ['ACTIVE', 'ARCHIVED'],
                    example: 'ACTIVE',
                    description: 'Project status',
                  },
                },
              },
            },
          },
        },

        // Project Members
        AddProjectMember: {
          required: true,
          description: 'Add member to project',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId'],
                properties: {
                  userId: {
                    type: 'integer',
                    example: 2,
                    description: 'User ID to add as project member',
                  },
                  role: {
                    type: 'string',
                    enum: ['ADMIN', 'LEAD', 'MEMBER', 'VIEWER'],
                    example: 'MEMBER',
                    description: 'Project role (defaults to MEMBER)',
                  },
                },
              },
            },
          },
        },

        UpdateProjectMemberRole: {
          required: true,
          description: 'Update project member role',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: {
                    type: 'string',
                    enum: ['ADMIN', 'LEAD', 'MEMBER', 'VIEWER'],
                    example: 'LEAD',
                    description: 'New role for member',
                  },
                },
              },
            },
          },
        },

        // Tasks
        CreateTask: {
          required: true,
          description: 'Create a new task',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: {
                    type: 'string',
                    example: 'Design homepage',
                    description: 'Task title (required)',
                  },
                  description: {
                    type: 'string',
                    example: 'Create mockups for new homepage',
                    description: 'Task description (optional)',
                  },
                  priority: {
                    type: 'string',
                    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
                    example: 'HIGH',
                    description: 'Task priority',
                  },
                  status: {
                    type: 'string',
                    enum: [
                      'BACKLOG',
                      'TODO',
                      'IN_PROGRESS',
                      'DONE',
                      'CANCELLED',
                    ],
                    example: 'TODO',
                    description: 'Task status',
                  },
                  assignedTo: {
                    type: 'integer',
                    example: 2,
                    description: 'User ID to assign task to (optional)',
                  },
                  dueDate: {
                    type: 'string',
                    format: 'date',
                    example: '2026-03-15',
                    description: 'Due date (optional)',
                  },
                },
              },
            },
          },
        },

        UpdateTask: {
          required: true,
          description: 'Update task details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    example: 'Design homepage mockups',
                    description: 'Task title',
                  },
                  description: {
                    type: 'string',
                    example:
                      'Create high-fidelity mockups for the new homepage design',
                    description: 'Task description',
                  },
                  status: {
                    type: 'string',
                    enum: [
                      'BACKLOG',
                      'TODO',
                      'IN_PROGRESS',
                      'DONE',
                      'CANCELLED',
                    ],
                    example: 'IN_PROGRESS',
                    description: 'Task status',
                  },
                  priority: {
                    type: 'string',
                    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
                    example: 'HIGH',
                    description: 'Task priority',
                  },
                  assignedTo: {
                    type: 'integer',
                    nullable: true,
                    example: 2,
                    description: 'User ID to assign task to',
                  },
                  dueDate: {
                    type: 'string',
                    format: 'date',
                    nullable: true,
                    example: '2026-03-15',
                    description: 'Task due date (YYYY-MM-DD)',
                  },
                },
              },
            },
          },
        },
      },

      // ===== RESPONSES =====
      responses: {
        // Auth/Users
        AuthSuccess: {
          description: 'Authentication successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'User registered successfully',
                  },
                  data: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        example: 1,
                      },
                      email: {
                        type: 'string',
                        example: 'john@example.com',
                      },
                      firstName: {
                        type: 'string',
                        example: 'John',
                      },
                      lastName: {
                        type: 'string',
                        example: 'Doe',
                      },
                      accessToken: {
                        type: 'string',
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                      },
                      refreshToken: {
                        type: 'string',
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                      },
                    },
                  },
                },
              },
            },
          },
        },

        TokenRefreshed: {
          description: 'Token refreshed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Token refreshed successfully',
                  },
                  data: {
                    type: 'object',
                    properties: {
                      accessToken: {
                        type: 'string',
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                      },
                      refreshToken: {
                        type: 'string',
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                      },
                    },
                  },
                },
              },
            },
          },
        },

        UsersRetrieved: {
          description: 'Users retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Users retrieved successfully',
                  },
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/User',
                    },
                  },
                },
              },
            },
          },
        },

        UserRetrieved: {
          description: 'User retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'User retrieved successfully',
                  },
                  data: {
                    $ref: '#/components/schemas/User',
                  },
                },
              },
            },
          },
        },

        UserUpdated: {
          description: 'User updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'User updated successfully',
                  },
                  data: {
                    $ref: '#/components/schemas/User',
                  },
                },
              },
            },
          },
        },

        // Organizations
        OrganizationCreated: {
          description: 'Organization created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Organization created successfully.',
                  },
                  data: {
                    $ref: '#/components/schemas/Organization',
                  },
                },
              },
            },
          },
        },

        OrganizationsRetrieved: {
          description: 'Organizations retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Organizations retrieved successfully.',
                  },
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Organization',
                    },
                  },
                },
              },
            },
          },
        },

        OrganizationRetrieved: {
          description: 'Organization retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Organization retrieved successfully.',
                  },
                  data: {
                    $ref: '#/components/schemas/Organization',
                  },
                },
              },
            },
          },
        },

        OrganizationUpdated: {
          description: 'Organization updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Organization updated successfully.',
                  },
                  data: {
                    $ref: '#/components/schemas/Organization',
                  },
                },
              },
            },
          },
        },

        OrganizationDeleted: {
          description: 'Organization deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Organization deleted successfully.',
                  },
                },
              },
            },
          },
        },

        // Memberships (Organization Level)
        MembersRetrieved: {
          description: 'Members retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Organization members retrieved successfully.',
                  },
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Membership',
                    },
                  },
                },
              },
            },
          },
        },

        MembershipCreated: {
          description: 'Member added successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Member added successfully.',
                  },
                  data: {
                    $ref: '#/components/schemas/Membership',
                  },
                },
              },
            },
          },
        },

        MembershipUpdated: {
          description: 'Member role updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Member role updated successfully.',
                  },
                  data: {
                    $ref: '#/components/schemas/Membership',
                  },
                },
              },
            },
          },
        },

        MembershipDeleted: {
          description: 'Member removed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Member removed successfully.',
                  },
                },
              },
            },
          },
        },

        // Projects
        ProjectCreated: {
          description: 'Project created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Project created successfully.',
                  },
                  data: {
                    $ref: '#/components/schemas/Project',
                  },
                },
              },
            },
          },
        },

        ProjectsRetrieved: {
          description: 'Projects retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Projects retrieved successfully.',
                  },
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Project',
                    },
                  },
                },
              },
            },
          },
        },

        ProjectRetrieved: {
          description: 'Project retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Project retrieved successfully.',
                  },
                  data: {
                    $ref: '#/components/schemas/Project',
                  },
                },
              },
            },
          },
        },

        ProjectUpdated: {
          description: 'Project updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Project updated successfully.',
                  },
                  data: {
                    $ref: '#/components/schemas/Project',
                  },
                },
              },
            },
          },
        },

        ProjectDeleted: {
          description: 'Project deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Project deleted successfully.',
                  },
                },
              },
            },
          },
        },

        // Project Members
        ProjectMembersRetrieved: {
          description: 'Project members retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Project members retrieved successfully.',
                  },
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/ProjectMembership',
                    },
                  },
                },
              },
            },
          },
        },

        ProjectMembershipCreated: {
          description: 'Member added to project successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Member added to project successfully.',
                  },
                  data: {
                    $ref: '#/components/schemas/ProjectMembership',
                  },
                },
              },
            },
          },
        },

        ProjectMembershipUpdated: {
          description: 'Project member role updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Member role updated successfully.',
                  },
                  data: {
                    $ref: '#/components/schemas/ProjectMembership',
                  },
                },
              },
            },
          },
        },

        ProjectMembershipDeleted: {
          description: 'Member removed from project successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Member removed from project.',
                  },
                },
              },
            },
          },
        },

        // Tasks
        TaskCreated: {
          description: 'Task created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Task created successfully.',
                  },
                  data: {
                    $ref: '#/components/schemas/Task',
                  },
                },
              },
            },
          },
        },

        TasksRetrieved: {
          description: 'Tasks retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Tasks retrieved successfully.',
                  },
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Task',
                    },
                  },
                },
              },
            },
          },
        },

        TaskRetrieved: {
          description: 'Task retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Task retrieved successfully.',
                  },
                  data: {
                    $ref: '#/components/schemas/Task',
                  },
                },
              },
            },
          },
        },

        TaskUpdated: {
          description: 'Task updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Task updated successfully.',
                  },
                  data: {
                    $ref: '#/components/schemas/Task',
                  },
                },
              },
            },
          },
        },

        TaskDeleted: {
          description: 'Task deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Task deleted successfully.',
                  },
                },
              },
            },
          },
        },

        // Error Responses
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
                    type: 'string',
                    example: 'VALIDATION_ERROR',
                  },
                  message: {
                    type: 'string',
                    example: 'Validation failed',
                  },
                },
              },
            },
          },
        },

        Unauthorized: {
          description: 'Unauthorized - Missing or invalid token',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
                    type: 'string',
                    example: 'UNAUTHORIZED',
                  },
                  message: {
                    type: 'string',
                    example: 'Authentication required',
                  },
                },
              },
            },
          },
        },

        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
                    type: 'string',
                    example: 'FORBIDDEN',
                  },
                  message: {
                    type: 'string',
                    example:
                      'You do not have permission to access this resource',
                  },
                },
              },
            },
          },
        },

        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
                    type: 'string',
                    example: 'NOT_FOUND',
                  },
                  message: {
                    type: 'string',
                    example: 'Resource not found',
                  },
                },
              },
            },
          },
        },

        Conflict: {
          description:
            'Resource already exists (e.g., email already registered)',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
                    type: 'string',
                    example: 'CONFLICT',
                  },
                  message: {
                    type: 'string',
                    example: 'Email already registered',
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/**/*.ts', './src/controllers/**/*.ts'],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      swaggerOptions: {
        persistAuthorization: true,
        displayOperationId: true,
      },
      customCss: '.swagger-ui .topbar { display: none }',
    })
  );

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}
