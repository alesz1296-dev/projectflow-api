import { ProjectService } from '../projectService';
import { prisma } from '../../lib/prisma';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    organization: {
      findUnique: jest.fn(),
    },
    membership: {
      findUnique: jest.fn(),
    },
    project: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projectMembership: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('ProjectService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    test('should create project and add creator as admin', async () => {
      const mockOrgFind = prisma.organization.findUnique as jest.Mock;
      const mockMembershipFind = prisma.membership.findUnique as jest.Mock;
      const mockTransaction = prisma.$transaction as jest.Mock;

      mockOrgFind.mockResolvedValueOnce({ id: 1, name: 'Test Org' });
      mockMembershipFind.mockResolvedValueOnce({ userId: 1 });

      mockTransaction.mockImplementationOnce(async (callback) => {
        const mockTx = {
          project: {
            create: jest.fn().mockResolvedValueOnce({
              id: 1,
              name: 'Test Project',
              organizationId: 1,
              creator: {
                id: 1,
                email: 'user@test.com',
                firstName: 'John',
                lastName: 'Doe',
              },
              organization: { id: 1, name: 'Test Org' },
            }),
          },
          projectMembership: {
            create: jest.fn().mockResolvedValueOnce({
              id: 1,
              userId: 1,
              projectId: 1,
              role: 'ADMIN',
            }),
          },
        };
        return callback(mockTx);
      });

      const result = await ProjectService.createProject(1, 1, {
        name: 'Test Project',
      });

      expect(result.name).toBe('Test Project');
    });

    test('should throw error if organization not found', async () => {
      const mockOrgFind = prisma.organization.findUnique as jest.Mock;
      mockOrgFind.mockResolvedValueOnce(null);

      await expect(
        ProjectService.createProject(1, 1, { name: 'Test' })
      ).rejects.toThrow('Organization not found');
    });

    test('should throw error if user not org member', async () => {
      const mockOrgFind = prisma.organization.findUnique as jest.Mock;
      const mockMembershipFind = prisma.membership.findUnique as jest.Mock;

      mockOrgFind.mockResolvedValueOnce({ id: 1 });
      mockMembershipFind.mockResolvedValueOnce(null);

      await expect(
        ProjectService.createProject(1, 1, { name: 'Test' })
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('getProjects', () => {
    test('should return all projects in organization', async () => {
      const mockOrgFind = prisma.organization.findUnique as jest.Mock;
      const mockFindMany = prisma.project.findMany as jest.Mock;

      mockOrgFind.mockResolvedValueOnce({ id: 1 });
      mockFindMany.mockResolvedValueOnce([
        {
          id: 1,
          name: 'Project 1',
          organizationId: 1,
          creator: {
            id: 1,
            email: 'user@test.com',
            firstName: 'John',
            lastName: 'Doe',
          },
          _count: { tasks: 5 },
        },
      ]);

      const result = await ProjectService.getProjects(1);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Project 1');
    });

    test('should throw error if organization not found', async () => {
      const mockOrgFind = prisma.organization.findUnique as jest.Mock;
      mockOrgFind.mockResolvedValueOnce(null);

      await expect(ProjectService.getProjects(999)).rejects.toThrow(
        'Organization not found'
      );
    });
  });

  describe('getProject', () => {
    test('should return project by id', async () => {
      const mockFindUnique = prisma.project.findUnique as jest.Mock;

      mockFindUnique.mockResolvedValueOnce({
        id: 1,
        name: 'Test Project',
        organizationId: 1,
        creator: {
          id: 1,
          email: 'user@test.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        organization: { id: 1, name: 'Test Org' },
        tasks: [],
        _count: { tasks: 0 },
      });

      const result = await ProjectService.getProject(1);

      expect(result.name).toBe('Test Project');
    });

    test('should throw error if project not found', async () => {
      const mockFindUnique = prisma.project.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValueOnce(null);

      await expect(ProjectService.getProject(999)).rejects.toThrow(
        'Project not found'
      );
    });
  });

  describe('getProjectsByStatus', () => {
    test('should return projects by status', async () => {
      const mockFindMany = prisma.project.findMany as jest.Mock;

      mockFindMany.mockResolvedValueOnce([
        {
          id: 1,
          name: 'Active Project',
          status: 'ACTIVE',
          creator: {
            id: 1,
            email: 'user@test.com',
            firstName: 'John',
            lastName: 'Doe',
          },
          organization: { id: 1 },
          _count: { tasks: 3 },
        },
      ]);

      const result = await ProjectService.getProjectsByStatus('ACTIVE');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('ACTIVE');
    });
  });

  describe('updateProject', () => {
    test('should update project if user is org member', async () => {
      const mockProjectFind = prisma.project.findUnique as jest.Mock;
      const mockMembershipFind = prisma.membership.findUnique as jest.Mock;
      const mockUpdate = prisma.project.update as jest.Mock;

      mockProjectFind.mockResolvedValueOnce({
        id: 1,
        organizationId: 1,
        name: 'Old Name',
        description: 'Old desc',
        status: 'ACTIVE',
      });
      mockMembershipFind.mockResolvedValueOnce({ userId: 1 });
      mockUpdate.mockResolvedValueOnce({
        id: 1,
        name: 'New Name',
        description: 'Old desc',
        status: 'ACTIVE',
        creator: {
          id: 1,
          email: 'user@test.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        organization: { id: 1 },
      });

      const result = await ProjectService.updateProject(1, 1, {
        name: 'New Name',
      });

      expect(result.name).toBe('New Name');
    });

    test('should throw error if user not org member', async () => {
      const mockProjectFind = prisma.project.findUnique as jest.Mock;
      const mockMembershipFind = prisma.membership.findUnique as jest.Mock;

      mockProjectFind.mockResolvedValueOnce({ id: 1, organizationId: 1 });
      mockMembershipFind.mockResolvedValueOnce(null);

      await expect(
        ProjectService.updateProject(1, 1, { name: 'New' })
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('deleteProject', () => {
    test('should delete project if user is org member', async () => {
      const mockProjectFind = prisma.project.findUnique as jest.Mock;
      const mockMembershipFind = prisma.membership.findUnique as jest.Mock;
      const mockDelete = prisma.project.delete as jest.Mock;

      mockProjectFind.mockResolvedValueOnce({ id: 1, organizationId: 1 });
      mockMembershipFind.mockResolvedValueOnce({ userId: 1 });
      mockDelete.mockResolvedValueOnce({ id: 1 });

      const result = await ProjectService.deleteProject(1, 1);

      expect(result.message).toContain('deleted successfully');
    });
  });

  describe('addProjectMember', () => {
    test('should add member to project', async () => {
      const mockProjectFind = prisma.project.findUnique as jest.Mock;
      const mockProjectMembershipFind = prisma.projectMembership
        .findUnique as jest.Mock;
      const mockOrgMembershipFind = prisma.membership.findUnique as jest.Mock;
      const mockCreate = prisma.projectMembership.create as jest.Mock;

      mockProjectFind.mockResolvedValueOnce({
        id: 1,
        organizationId: 1,
      });
      mockProjectMembershipFind.mockResolvedValueOnce({
        role: 'ADMIN',
      });
      mockOrgMembershipFind.mockResolvedValueOnce({ userId: 2 });
      mockCreate.mockResolvedValueOnce({
        id: 1,
        userId: 2,
        projectId: 1,
        role: 'MEMBER',
        user: {
          id: 2,
          email: 'user@test.com',
          firstName: 'Jane',
          lastName: 'Doe',
        },
      });

      const result = await ProjectService.addProjectMember(1, 2, 'MEMBER', 1);

      expect(result.role).toBe('MEMBER');
    });

    test('should throw error if requester not project admin', async () => {
      const mockProjectFind = prisma.project.findUnique as jest.Mock;
      const mockProjectMembershipFind = prisma.projectMembership
        .findUnique as jest.Mock;

      mockProjectFind.mockResolvedValueOnce({ id: 1, organizationId: 1 });
      mockProjectMembershipFind.mockResolvedValueOnce({ role: 'MEMBER' });

      await expect(
        ProjectService.addProjectMember(1, 2, 'MEMBER', 1)
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('getProjectMembers', () => {
    test('should return all project members', async () => {
      const mockProjectFind = prisma.project.findUnique as jest.Mock;
      const mockFindMany = prisma.projectMembership.findMany as jest.Mock;

      mockProjectFind.mockResolvedValueOnce({ id: 1 });
      mockFindMany.mockResolvedValueOnce([
        {
          id: 1,
          userId: 1,
          projectId: 1,
          user: {
            id: 1,
            email: 'user@test.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      ]);

      const result = await ProjectService.getProjectMembers(1);

      expect(result).toHaveLength(1);
    });

    test('should throw error if project not found', async () => {
      const mockProjectFind = prisma.project.findUnique as jest.Mock;
      mockProjectFind.mockResolvedValueOnce(null);

      await expect(ProjectService.getProjectMembers(999)).rejects.toThrow(
        'Project not found'
      );
    });
  });

  describe('updateProjectMemberRole', () => {
    test('should update project member role', async () => {
      const mockProjectMembershipFind = prisma.projectMembership
        .findUnique as jest.Mock;
      const mockUpdate = prisma.projectMembership.update as jest.Mock;

      mockProjectMembershipFind
        .mockResolvedValueOnce({ role: 'ADMIN' })
        .mockResolvedValueOnce({ id: 1, role: 'MEMBER' });
      mockUpdate.mockResolvedValueOnce({
        id: 1,
        userId: 2,
        projectId: 1,
        role: 'LEAD',
        user: {
          id: 2,
          email: 'user@test.com',
          firstName: 'Jane',
          lastName: 'Doe',
        },
      });

      const result = await ProjectService.updateProjectMemberRole(
        1,
        2,
        'LEAD',
        1
      );

      expect(result.role).toBe('LEAD');
    });
  });

  describe('removeProjectMember', () => {
    test('should remove project member', async () => {
      const mockProjectMembershipFind = prisma.projectMembership
        .findUnique as jest.Mock;
      const mockDelete = prisma.projectMembership.delete as jest.Mock;

      mockProjectMembershipFind
        .mockResolvedValueOnce({ role: 'ADMIN' })
        .mockResolvedValueOnce({ id: 1 });
      mockDelete.mockResolvedValueOnce({ id: 1 });

      const result = await ProjectService.removeProjectMember(1, 2, 1);

      expect(result.message).toContain('removed successfully');
    });
  });
});
