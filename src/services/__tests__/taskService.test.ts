import { TaskService } from '../taskService';
import { prisma } from '../../lib/prisma';

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  prisma: {
    membership: {
      findUnique: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
    },
  },
}));

describe('TaskService.getAllTasksInOrganization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authorization', () => {
    test('should throw error if user is not in organization', async () => {
      // Arrange
      const mockFindUnique = prisma.membership.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(TaskService.getAllTasksInOrganization(1, 1)).rejects.toThrow(
        'Unauthorized'
      );
    });
  });

  describe('No Filters', () => {
    test('should return all tasks when no filters provided', async () => {
      // Arrange
      const mockMembership = {
        id: 1,
        userId: 1,
        organizationId: 1,
        role: 'member',
      };
      const mockTasks: any[] = [
        {
          id: 1,
          title: 'Task 1',
          status: 'TODO',
          priority: 'HIGH',
          project: { id: 1, name: 'Project 1', organizationId: 1 },
          assignee: null,
        },
        {
          id: 2,
          title: 'Task 2',
          status: 'DONE',
          priority: 'LOW',
          project: { id: 1, name: 'Project 1', organizationId: 1 },
          assignee: null,
        },
      ];

      const mockFindUnique = prisma.membership.findUnique as jest.Mock;
      const mockFindMany = prisma.task.findMany as jest.Mock;

      mockFindUnique.mockResolvedValueOnce(mockMembership);
      mockFindMany.mockResolvedValueOnce(mockTasks);

      // Act
      const result = await TaskService.getAllTasksInOrganization(1, 1);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });
  });

  describe('Status Filter', () => {
    test('should filter tasks by status=TODO', async () => {
      // Arrange
      const mockMembership = {
        id: 1,
        userId: 1,
        organizationId: 1,
        role: 'member',
      };
      const mockTasks: any[] = [
        {
          id: 1,
          title: 'Task 1',
          status: 'TODO',
          priority: 'HIGH',
          project: { id: 1, name: 'Project 1', organizationId: 1 },
          assignee: null,
        },
      ];

      const mockFindUnique = prisma.membership.findUnique as jest.Mock;
      const mockFindMany = prisma.task.findMany as jest.Mock;

      mockFindUnique.mockResolvedValueOnce(mockMembership);
      mockFindMany.mockResolvedValueOnce(mockTasks);

      // Act
      const result = await TaskService.getAllTasksInOrganization(1, 1, {
        status: 'TODO',
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('TODO');

      // Verify the where clause included the filter
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'TODO',
            project: { organizationId: 1 },
          }),
        })
      );
    });
  });

  describe('Priority Filter', () => {
    test('should filter tasks by priority=HIGH', async () => {
      // Arrange
      const mockMembership = {
        id: 1,
        userId: 1,
        organizationId: 1,
        role: 'member',
      };
      const mockTasks: any[] = [
        {
          id: 1,
          title: 'Task 1',
          status: 'TODO',
          priority: 'HIGH',
          project: { id: 1, name: 'Project 1', organizationId: 1 },
          assignee: null,
        },
      ];

      const mockFindUnique = prisma.membership.findUnique as jest.Mock;
      const mockFindMany = prisma.task.findMany as jest.Mock;

      mockFindUnique.mockResolvedValueOnce(mockMembership);
      mockFindMany.mockResolvedValueOnce(mockTasks);

      // Act
      const result = await TaskService.getAllTasksInOrganization(1, 1, {
        priority: 'HIGH',
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].priority).toBe('HIGH');

      // Verify the where clause included the filter
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priority: 'HIGH',
            project: { organizationId: 1 },
          }),
        })
      );
    });
  });

  describe('Multiple Filters', () => {
    test('should filter tasks by status AND priority', async () => {
      // Arrange
      const mockMembership = {
        id: 1,
        userId: 1,
        organizationId: 1,
        role: 'member',
      };
      const mockTasks: any[] = [
        {
          id: 1,
          title: 'Task 1',
          status: 'TODO',
          priority: 'HIGH',
          project: { id: 1, name: 'Project 1', organizationId: 1 },
          assignee: null,
        },
      ];

      const mockFindUnique = prisma.membership.findUnique as jest.Mock;
      const mockFindMany = prisma.task.findMany as jest.Mock;

      mockFindUnique.mockResolvedValueOnce(mockMembership);
      mockFindMany.mockResolvedValueOnce(mockTasks);

      // Act
      const result = await TaskService.getAllTasksInOrganization(1, 1, {
        status: 'TODO',
        priority: 'HIGH',
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('TODO');
      expect(result[0].priority).toBe('HIGH');

      // Verify both filters were applied
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'TODO',
            priority: 'HIGH',
            project: { organizationId: 1 },
          }),
        })
      );
    });
  });

  describe('Ordering', () => {
    test('should order tasks by priority DESC then dueDate ASC', async () => {
      // Arrange
      const mockMembership = {
        id: 1,
        userId: 1,
        organizationId: 1,
        role: 'member',
      };
      const mockTasks: any = [];

      const mockFindUnique = prisma.membership.findUnique as jest.Mock;
      const mockFindMany = prisma.task.findMany as jest.Mock;

      mockFindUnique.mockResolvedValueOnce(mockMembership);
      mockFindMany.mockResolvedValueOnce(mockTasks);

      // Act
      await TaskService.getAllTasksInOrganization(1, 1);

      // Assert: Verify ordering is correct
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        })
      );
    });
  });
});
